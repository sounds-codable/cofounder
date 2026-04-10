import { View, Text, Input } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { waitlistApi } from '@/services/api'
import './index6.scss'

type SubmitState = 'idle' | 'loading' | 'done' | 'error'
type MvpTipKey = 'hero' | 'how' | null

export default function Index6() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<SubmitState>('idle')
  const [message, setMessage] = useState('')
  const [activeMvpTip, setActiveMvpTip] = useState<MvpTipKey>(null)

  const renderMvpHint = (tipKey: Exclude<MvpTipKey, null>) => (
    <View
      className={`mvp-wrap tip-${tipKey} ${activeMvpTip === tipKey ? 'show' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        setActiveMvpTip((prev) => (prev === tipKey ? null : tipKey))
      }}
    >
      <Text className='mvp-text'>MVP</Text>
      <Text className='mvp-icon'>i</Text>
      <View className='mvp-pop'>
        <Text className='mvp-pop-title'>为什么先做 MVP？</Text>
        <Text className='mvp-pop-desc'>
          先做最小可用版本，能用更少时间和成本，快速验证是否有人真的愿意使用和付费。
        </Text>
      </View>
    </View>
  )

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      Taro.showToast({ title: '请输入有效邮箱', icon: 'none' })
      return
    }

    setStatus('loading')
    setMessage('')
    try {
      const res = await waitlistApi.subscribe(email)
      if (res.success) {
        setStatus('done')
        const successMessage = res.message || '申请成功，已加入排队序列。名额开放后我们会邮件通知你，请留意邮箱。'
        setMessage(successMessage)
        Taro.showModal({
          title: '申请已提交',
          content: successMessage,
          showCancel: false,
          confirmText: '我知道了',
        })
      } else {
        setStatus('error')
        setMessage(res.message || '订阅失败，请稍后重试')
      }
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || '网络异常，请稍后重试')
    }
  }

  return (
    <View className='index6 theme-tech' onClick={() => setActiveMvpTip(null)}>
      <View className='bg-glow glow-1' />
      <View className='bg-glow glow-2' />

      <View className='hero'>
        <Text className='brand'>ICU · I SEE YOU</Text>
        <Text className='headline'>AI 时代，不做旁观者</Text>
        <View className='subline mvp-line'>
          <Text>先做一个 </Text>
          {renderMvpHint('hero')}
          <Text>，给自己留住主动权，而不是等被替代。</Text>
        </View>
      </View>

      <View className='risk-grid'>
        <View className='panel'>
          <Text className='kicker'>给项目方 / 专业人士</Text>
          <Text className='panel-title'>两件事会很快发生</Text>
          <View className='panel-list'>
            <View className='panel-item'>
              <Text className='bullet'>•</Text>
              <Text className='panel-item-text'>AI 替代工作是必然，而且速度会超出多数人的预期。</Text>
            </View>
            <View className='panel-item'>
              <Text className='bullet'>•</Text>
              <Text className='panel-item-text'>职场中年危机一直存在，年轻人会持续冲击传统岗位。</Text>
            </View>
            <Text className='panel-plain'>现在最稳妥的做法，不是观望，而是尽快把行业经验做成细分应用。</Text>
          </View>
        </View>

        <View className='panel'>
          <Text className='kicker'>给程序员</Text>
          <Text className='panel-title'>现实已经很明确</Text>
          <View className='panel-list'>
            <View className='panel-item'>
              <Text className='bullet'>•</Text>
              <Text className='panel-item-text'>大量程序员已经被优化，更多人正在路上。</Text>
            </View>
            <View className='panel-item'>
              <Text className='bullet'>•</Text>
              <Text className='panel-item-text'>大多数人只看得到通用需求，而通用需求会被大厂快速覆盖。</Text>
            </View>
            <Text className='panel-plain'>更容易成功的方向，是和垂直领域专家一起做小而深的应用。</Text>
          </View>
        </View>
      </View>

      <View className='coop-grid'>
        <View className='coop-card'>
          <Text className='kicker'>WHY</Text>
          <Text className='coop-title'>为什么必须是「程序员 × 专家」</Text>
          <Text className='coop-desc'>
            只有专家，想法落不了地；只有程序员，做不出细分应用。两个人一起，才是最快且最稳的起点。
          </Text>
        </View>

        <View className={`coop-card ${activeMvpTip === 'how' ? 'active-tip' : ''}`}>
          <Text className='kicker'>HOW</Text>
          <Text className='coop-title'>如何让双方真正合作</Text>
          <View className='coop-line'>
            <Text>专家提供真需求并营销产品，程序员负责技术实现。双向匹配后先做 </Text>
            {renderMvpHint('how')}
            <Text>，边合作边验证。</Text>
          </View>
        </View>

        <View className='coop-card'>
          <Text className='kicker'>WHAT</Text>
          <Text className='coop-title'>你们会得到什么结果</Text>
          <Text className='coop-desc'>
            专家快速得到 MVP 验证需求，程序员深入了解细分行业真实场景。开始行动，就有收获！
          </Text>
        </View>
      </View>

      <View className='cta-card'>
        <Text className='cta-title'>现在就开始你的副业 / 创业试验</Text>
        <Text className='cta-sub'>小投入，快验证，借助 AI 做出睡后收入</Text>

        <View className='row'>
          <Input
            className='email'
            type='text'
            value={email}
            onInput={(e) => setEmail(e.detail.value)}
            placeholder='请输入邮箱，例如 your@email.com'
            placeholderStyle='color: var(--text-placeholder);'
            disabled={status === 'loading'}
          />
          <View
            className={`submit ${status === 'loading' ? 'disabled' : ''}`}
            onClick={status === 'loading' ? undefined : handleSubmit}
          >
            <Text className='submit-text'>{status === 'loading' ? '提交中...' : '抢先体验'}</Text>
          </View>
        </View>

        {status === 'done' && <Text className='ok'>{message}</Text>}
        {status === 'error' && <Text className='err'>{message}</Text>}
      </View>
    </View>
  )
}
