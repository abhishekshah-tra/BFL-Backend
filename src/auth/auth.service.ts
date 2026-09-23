import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { createHash, randomUUID } from 'crypto';

import {
  User,
  UserDocument,
} from '../schemas/user.schema.js';

import {
  Role,
  RoleDocument,
} from '../schemas/role.schema.js';

import {
  RolePermission,
  RolePermissionDocument,
} from '../schemas/role-permission.schema.js';

import {
  AuthSession,
  AuthSessionDocument,
} from '../schemas/auth-session.schema.js';

import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';

@Injectable()
export class AuthService {
  private readonly accessTokenExpiry =
    15 * 60 * 1000;

  private readonly refreshTokenExpiry =
    7 * 24 * 60 * 60 * 1000;

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,

    @InjectModel(RolePermission.name)
    private readonly rolePermissionModel:
      Model<RolePermissionDocument>,

    @InjectModel(AuthSession.name)
    private readonly sessionModel:
      Model<AuthSessionDocument>,

    private readonly jwtService: JwtService,
    
  ) { }

  // ==========================================
  // LOGIN
  // ==========================================


  private groupPermissions(permissions: any[]) {
    const grouped = new Map<
      string,
      {
        screenId: string;
        screenCode: string;
        screenName: string;
        actions: {
          actionId: string;
          actionCode: string;
          actionName: string;
        }[];
      }
    >();

    for (const permission of permissions) {
      if (
        !permission?.screenId ||
        !permission?.actionId
      ) {
        continue;
      }

      const screenId = permission.screenId.toString();

      if (!grouped.has(screenId)) {
        grouped.set(screenId, {
          screenId,
          screenCode: permission.screenCode || '',
          screenName: permission.screenName || '',
          actions: [],
        });
      }

      grouped.get(screenId)!.actions.push({
        actionId: permission.actionId.toString(),
        actionCode: permission.actionCode || '',
        actionName: permission.actionName || '',
      });
    }

    return Array.from(grouped.values());
  }

  async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const email =
      dto.email.toLowerCase().trim();

    const user = await this.userModel
      .findOne({
        email,
      })
      .select('+password')
      .lean();

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'User account is inactive',
      );
    }

    const passwordValid =
      await bcrypt.compare(
        dto.password,
        user.password,
      );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const role = await this.roleModel
      .findOne({
        _id: user.roleId,
        isActive: true,
      })
      .lean();

    if (!role) {
      throw new UnauthorizedException(
        'User role is inactive or unavailable',
      );
    }

    const permissions =
      await this.getUserPermissions(
        user.roleId,
      );

    const sessionId = randomUUID();
    const accessTokenJti = randomUUID();

    const accessTokenExpiresAt =
      new Date(
        Date.now() +
        this.accessTokenExpiry,
      );

    const refreshTokenExpiresAt =
      new Date(
        Date.now() +
        this.refreshTokenExpiry,
      );

    const accessToken =
      await this.jwtService.signAsync({
        sub: user._id.toString(),
        email: user.email,
        roleId: user.roleId.toString(),
        sid: sessionId,
        jti: accessTokenJti,
        type: 'access',
      });

    const refreshToken =
      await this.jwtService.signAsync({
        sub: user._id.toString(),
        sid: sessionId,
        jti: randomUUID(),
        type: 'refresh',
      });

    await this.sessionModel.create({
      userId: user._id,
      sessionId,
      accessTokenJti,
      accessTokenHash:
        this.hashToken(accessToken),
      refreshTokenHash:
        this.hashToken(refreshToken),
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      isActive: true,
      lastActivityAt: new Date(),
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenExpiry / 1000,

      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: {
          id: role._id,
          name: role.name,
          code: role.code,
        },
        permissions: this.groupPermissions(permissions),
      },
    };
  }

  // ==========================================
  // VALIDATE ACCESS TOKEN
  // ==========================================

  async validateAccessToken(
    token: string,
    payload: any,
  ) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException(
        'Invalid access token',
      );
    }

    const session =
      await this.sessionModel.findOne({
        sessionId: payload.sid,
        accessTokenJti: payload.jti,
        isActive: true,
      });

    if (!session) {
      throw new UnauthorizedException(
        'Session expired or revoked',
      );
    }

    if (
      session.accessTokenExpiresAt.getTime() <
      Date.now()
    ) {
      await this.revokeSession(
        session.sessionId,
        'Access token expired',
      );

      throw new UnauthorizedException(
        'Access token expired',
      );
    }

    const tokenHash =
      this.hashToken(token);

    if (
      tokenHash !==
      session.accessTokenHash
    ) {
      throw new UnauthorizedException(
        'Invalid session token',
      );
    }

    const user =
      await this.userModel
        .findById(payload.sub)
        .lean();

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'User account is inactive',
      );
    }

    const role =
      await this.roleModel
        .findOne({
          _id: user.roleId,
          isActive: true,
        })
        .lean();

    if (!role) {
      throw new UnauthorizedException(
        'User role is inactive',
      );
    }

    session.lastActivityAt =
      new Date();

    await session.save();

    return {
      userId: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: role._id.toString(),
      role: {
        id: role._id.toString(),
        name: role.name,
        code: role.code,
      },
    };
  }

  // ==========================================
  // REFRESH TOKEN
  // ==========================================

  async refreshToken(
    dto: RefreshTokenDto,
  ) {
    let payload: any;

    try {
      payload =
        await this.jwtService.verifyAsync(
          dto.refreshToken,
        );
    } catch {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    const session =
      await this.sessionModel.findOne({
        sessionId: payload.sid,
        isActive: true,
      });

    if (!session) {
      throw new UnauthorizedException(
        'Session expired or revoked',
      );
    }

    if (
      session.refreshTokenExpiresAt.getTime() <
      Date.now()
    ) {
      await this.revokeSession(
        session.sessionId,
        'Refresh token expired',
      );

      throw new UnauthorizedException(
        'Refresh token expired',
      );
    }

    const refreshTokenHash =
      this.hashToken(
        dto.refreshToken,
      );

    if (
      refreshTokenHash !==
      session.refreshTokenHash
    ) {
      await this.revokeSession(
        session.sessionId,
        'Invalid refresh token',
      );

      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    const user =
      await this.userModel
        .findById(session.userId)
        .lean();

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'User account is inactive',
      );
    }

    const role =
      await this.roleModel.findOne({
        _id: user.roleId,
        isActive: true,
      });

    if (!role) {
      throw new UnauthorizedException(
        'User role is inactive',
      );
    }

    // Rotate access token
    const accessTokenJti =
      randomUUID();

    const accessTokenExpiresAt =
      new Date(
        Date.now() +
        this.accessTokenExpiry,
      );

    const accessToken =
      await this.jwtService.signAsync({
        sub: user._id.toString(),
        email: user.email,
        roleId: user.roleId.toString(),
        sid: session.sessionId,
        jti: accessTokenJti,
        type: 'access',
      });

    // Rotate refresh token
    const refreshTokenJti =
      randomUUID();

    const refreshToken =
      await this.jwtService.signAsync({
        sub: user._id.toString(),
        sid: session.sessionId,
        jti: refreshTokenJti,
        type: 'refresh',
      });

    session.accessTokenJti =
      accessTokenJti;

    session.accessTokenHash =
      this.hashToken(accessToken);

    session.refreshTokenHash =
      this.hashToken(refreshToken);

    session.accessTokenExpiresAt =
      accessTokenExpiresAt;

    session.lastActivityAt =
      new Date();

    await session.save();

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn:
        this.accessTokenExpiry / 1000,
    };
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  async logout(sessionId: string) {
    const session =
      await this.sessionModel.findOne({
        sessionId,
      });

    if (!session) {
      return {
        message: 'Logged out successfully',
      };
    }

    session.isActive = false;
    session.revokedAt = new Date();
    session.revokeReason = 'User logout';

    await session.save();

    return {
      message: 'Logged out successfully',
    };
  }

  // ==========================================
  // LOGOUT ALL SESSIONS
  // ==========================================

  async logoutAll(userId: string) {
    await this.sessionModel.updateMany(
      {
        userId: new Types.ObjectId(
          userId,
        ),
        isActive: true,
      },
      {
        $set: {
          isActive: false,
          revokedAt: new Date(),
          revokeReason:
            'Logout all sessions',
        },
      },
    );

    return {
      message:
        'All sessions logged out successfully',
    };
  }

  // ==========================================
  // GET CURRENT USER
  // ==========================================

  async getMe(userId: string) {
    const user =
      await this.userModel
        .findById(userId)
        .populate({
          path: 'roleId',
          select:
            'name code description isActive isSystemRole',
        })
        .select('-password')
        .lean();

    if (!user) {
      throw new UnauthorizedException(
        'User not found',
      );
    }

    const permissions =
      await this.getUserPermissions(
        user.roleId?._id ||
        user.roleId,
      );

    return {
      ...user,
      permissions: this.groupPermissions(permissions),
    };
  }

  // ==========================================
  // USER PERMISSIONS
  // ==========================================

  private async getUserPermissions(
    roleId: Types.ObjectId,
  ) {
    const permissions = await this.rolePermissionModel
      .find({
        roleId,
        isActive: true,
      })
      .populate({
        path: 'screenId',
        select: '_id name code',
      })
      .populate({
        path: 'actionId',
        select: '_id name code',
      })
      .lean();

    return permissions
      .filter(
        (permission: any) =>
          permission.screenId &&
          permission.actionId,
      )
      .map((permission: any) => ({
        screenId: permission.screenId._id.toString(),
        screenCode: permission.screenId.code || '',
        screenName: permission.screenId.name || '',
        actionId: permission.actionId._id.toString(),
        actionCode: permission.actionId.code || '',
        actionName: permission.actionId.name || '',
      }));
  }

  // ==========================================
  // REVOKE SESSION
  // ==========================================

  private async revokeSession(
    sessionId: string,
    reason: string,
  ) {
    await this.sessionModel.updateOne(
      {
        sessionId,
      },
      {
        $set: {
          isActive: false,
          revokedAt: new Date(),
          revokeReason: reason,
        },
      },
    );
  }

  // ==========================================
  // HASH TOKEN
  // ==========================================

  private hashToken(token: string) {
    return createHash('sha256')
      .update(token)
      .digest('hex');
  }
}