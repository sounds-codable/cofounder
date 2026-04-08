import { IsBoolean, IsEnum, IsString } from 'class-validator';
import { CardEngagementType } from '../../common/enums/card-engagement-type.enum';

export class ToggleCardEngagementDto {
  @IsString()
  cardId!: string;

  @IsEnum(CardEngagementType)
  type!: CardEngagementType;

  @IsBoolean()
  active!: boolean;
}
