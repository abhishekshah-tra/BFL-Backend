import { Injectable } from '@nestjs/common';
import { CreateScreenDto } from './dto/create-screen.dto.js';
import { UpdateScreenDto } from './dto/update-screen.dto.js';

@Injectable()
export class ScreensService {
  create(createScreenDto: CreateScreenDto) {
    return 'This action adds a new screen';
  }

  findAll() {
    return `This action returns all screens`;
  }

  findOne(id: number) {
    return `This action returns a #${id} screen`;
  }

  update(id: number, updateScreenDto: UpdateScreenDto) {
    return `This action updates a #${id} screen`;
  }

  remove(id: number) {
    return `This action removes a #${id} screen`;
  }
}
