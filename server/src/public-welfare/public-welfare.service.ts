import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePublicWelfareMessageDto } from './dto/create-public-welfare-message.dto';
import { PublicWelfareMessage } from './public-welfare-message.entity';

@Injectable()
export class PublicWelfareService {
  constructor(
    @InjectRepository(PublicWelfareMessage)
    private readonly publicWelfareMessageRepository: Repository<PublicWelfareMessage>,
  ) {}

  async createMessage(body: CreatePublicWelfareMessageDto) {
    const message = this.publicWelfareMessageRepository.create({
      name: body.name?.trim() || null,
      contact: body.contact.trim(),
      message: body.message.trim(),
    });

    const savedMessage = await this.publicWelfareMessageRepository.save(message);

    return {
      id: savedMessage.id,
      createdAt: savedMessage.createdAt.toISOString(),
    };
  }
}
