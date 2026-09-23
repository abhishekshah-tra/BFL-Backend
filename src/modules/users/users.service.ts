import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';

import {
  User,
  UserDocument,
} from '../../schemas/user.schema.js';

import {
  Role,
  RoleDocument,
} from '../../schemas/role.schema.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,
  ) {}


  async create(createUserDto: CreateUserDto) {
    const {
      firstName,
      lastName,
      email,
      password,
      roleId,
      isActive = true,
    } = createUserDto;

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await this.userModel
      .findOne({
        email: normalizedEmail,
      })
      .lean();

    if (existingUser) {
      throw new ConflictException(
        'User with this email already exists',
      );
    }

    const role = await this.roleModel
      .findOne({
        _id: new Types.ObjectId(roleId),
        isActive: true,
      })
      .lean();

    if (!role) {
      throw new BadRequestException(
        'Role not found or inactive',
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10,
    );

    const user = await this.userModel.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      roleId: new Types.ObjectId(roleId),
      isActive,
    });

    return this.sanitizeUser(user);
  }

  async findAll() {
    return this.userModel
      .find()
      .populate({
        path: 'roleId',
        select: 'name code description isActive isSystemRole',
      })
      .select('-password')
      .sort({
        createdAt: -1,
      })
      .lean();
  }


  async findActiveUsers() {
    return this.userModel
      .find({
        isActive: true,
      })
      .populate({
        path: 'roleId',
        select: 'name code description isActive isSystemRole',
      })
      .select('-password')
      .sort({
        firstName: 1,
      })
      .lean();
  }


  async findInactiveUsers() {
    return this.userModel
      .find({
        isActive: false,
      })
      .populate({
        path: 'roleId',
        select: 'name code description isActive isSystemRole',
      })
      .select('-password')
      .sort({
        firstName: 1,
      })
      .lean();
  }


  async findOne(id: string) {
    this.validateObjectId(id);

    const user = await this.userModel
      .findById(id)
      .populate({
        path: 'roleId',
        select: 'name code description isActive isSystemRole',
      })
      .select('-password')
      .lean();

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return user;
  }

  // =========================
  // UPDATE USER
  // =========================

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ) {
    this.validateObjectId(id);

    const user =
      await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    // Email
    if (updateUserDto.email) {
      const normalizedEmail =
        updateUserDto.email
          .toLowerCase()
          .trim();

      const existingUser =
        await this.userModel.findOne({
          email: normalizedEmail,
          _id: {
            $ne: id,
          },
        });

      if (existingUser) {
        throw new ConflictException(
          'User with this email already exists',
        );
      }

      user.email = normalizedEmail;
    }

    // First name
    if (
      updateUserDto.firstName !== undefined
    ) {
      user.firstName =
        updateUserDto.firstName;
    }

    // Last name
    if (
      updateUserDto.lastName !== undefined
    ) {
      user.lastName =
        updateUserDto.lastName;
    }

    // Password
    if (updateUserDto.password) {
      user.password =
        await bcrypt.hash(
          updateUserDto.password,
          10,
        );
    }

    // Role
    if (
      updateUserDto.roleId !== undefined
    ) {
      const role =
        await this.roleModel.findOne({
          _id: new Types.ObjectId(
            updateUserDto.roleId,
          ),
          isActive: true,
        });

      if (!role) {
        throw new BadRequestException(
          'Role not found or inactive',
        );
      }

      user.roleId =
        new Types.ObjectId(
          updateUserDto.roleId,
        );
    }

    // Active status
    if (
      updateUserDto.isActive !== undefined
    ) {
      user.isActive =
        updateUserDto.isActive;
    }

    await user.save();

    return this.findOne(id);
  }

  async remove(id: string) {
    this.validateObjectId(id);

    const user =
      await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    await this.userModel.findByIdAndDelete(id);

    return {
      message: 'User deleted successfully',
      id,
    };
  }


  async updateStatus(
    id: string,
    updateUserStatusDto: UpdateUserStatusDto,
  ) {
    this.validateObjectId(id);

    const user =
      await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    user.isActive =
      updateUserStatusDto.isActive;

    await user.save();

    return {
      message:
        updateUserStatusDto.isActive
          ? 'User activated successfully'
          : 'User deactivated successfully',
      user: await this.findOne(id),
    };
  }

  async activate(id: string) {
    return this.updateStatus(id, {
      isActive: true,
    });
  }

  async deactivate(id: string) {
    return this.updateStatus(id, {
      isActive: false,
    });
  }

  private validateObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'Invalid user ID',
      );
    }
  }

  private sanitizeUser(user: UserDocument) {
    const {
      password,
      ...result
    } = user.toObject();

    return result;
  }
}