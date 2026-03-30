import { IsString, MinLength } from 'class-validator';

export class CreateDetailRequestDto {
  @IsString()
  @MinLength(3)
  cardId!: string;
}
