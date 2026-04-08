import { RewardAction } from '../common/enums/reward-action.enum';

export const rewardPointsConfig: Record<
  RewardAction,
  {
    points: number;
    label: string;
  }
> = {
  [RewardAction.PUBLISH_PROJECT]: {
    points: 20,
    label: '发布项目',
  },
  [RewardAction.REGISTER_DEVELOPER]: {
    points: 15,
    label: '登记程序员信息',
  },
  [RewardAction.LIKE_CARD]: {
    points: 2,
    label: '点赞',
  },
  [RewardAction.FAVORITE_CARD]: {
    points: 3,
    label: '收藏',
  },
  [RewardAction.MATCH_SUCCESS]: {
    points: 40,
    label: '项目匹配成功',
  },
  [RewardAction.INVITE_USER]: {
    points: 25,
    label: '邀请新用户注册',
  },
};
