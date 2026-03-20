import { View, Text, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { storage } from '@/utils/storage'
import { projectApi, developerApi } from '@/services/api'
import './index.scss'

export default function Index3() {
  const [projects, setProjects] = useState<any[]>([])
  const [developers, setDevelopers] = useState<any[]>([])
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')

  useDidShow(() => {
    loadData()
  })

  const loadData = async () => {
    try {
      const [projectsRes, developersRes] = await Promise.all([
        projectApi.list({ limit: 3 }).catch(() => ({ items: [] })),
        developerApi.list({ limit: 3 }).catch(() => ({ items: [] })),
      ])
      setProjects(projectsRes.items || [])
      setDevelopers(developersRes.items || [])
    } catch (error) {
      console.log('获取数据失败', error)
    }
  }

  const handleEmailSubmit = () => {
    if (!email || !email.includes('@')) {
      Taro.showToast({ title: '请输入有效邮箱', icon: 'none' })
      return
    }
    if (!selectedRole) {
      Taro.showToast({ title: '请选择身份', icon: 'none' })
      return
    }
    setSubmitted(true)
    setTimeout(() => {
      Taro.navigateTo({ url: `/pages/login/index?role=${selectedRole}&email=${encodeURIComponent(email)}` })
    }, 600)
  }

  const handleDirectLogin = (role: string) => {
    Taro.navigateTo({ url: `/pages/login/index?role=${role}` })
  }

  return (
    <View className='landing'>

      {/* ===== HERO — ICU ===== */}
      <View className='hero'>
        <View className='hero-inner'>
          <View className='hero-pulse' />
          <Text className='hero-icu'>ICU</Text>
          <Text className='hero-icu-sub'>February February February February February Febru— I. See. You.</Text>

          <Text className='hero-headline'>
            你的想法正在死去。{'\n'}
            因为你一个人做不了。
          </Text>

          <Text className='hero-desc'>
            行业专家 × 程序员，股权合伙，不是雇佣。
          </Text>

          <View className='hero-cta'>
            <View
              className='cta-btn cta-primary'
              onClick={() => handleDirectLogin('project_owner')}
            >
              <Text className='cta-btn-text'>我有想法，缺技术</Text>
            </View>
            <View
              className='cta-btn cta-secondary'
              onClick={() => handleDirectLogin('developer')}
            >
              <Text className='cta-btn-text'>我有技术，缺方向</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ===== FLATLINE — 痛点 ===== */}
      <View className='section section-flatline'>
        <View className='section-inner'>
          <View className='monitor-line' />
          <Text className='section-headline'>
            每天有1000个好想法死掉。{'\n'}
            死因都一样。
          </Text>

          <View className='death-grid'>
            <View className='death-card'>
              <Text className='death-label'>💼 项目方</Text>
              <Text className='death-cause'>有十年行业经验，但不会写一行代码。</Text>
              <Text className='death-result'>外包做出来的东西，自己都不想用。</Text>
            </View>
            <View className='death-card'>
              <Text className='death-label'>💻 程序员</Text>
              <Text className='death-cause'>能写任何系统，但不知道该写什么。</Text>
              <Text className='death-result'>写了十年代码，没有一行属于自己。</Text>
            </View>
          </View>

          <Text className='flatline-truth'>
            不是缺钱。不是缺能力。{'\n'}是缺一个对的搭档。
          </Text>
        </View>
      </View>

      {/* ===== DEFIB — 方案 ===== */}
      <View className='section section-defib'>
        <View className='section-inner'>
          <Text className='defib-charge'>⚡ CLEAR</Text>
          <Text className='section-headline'>
            叩饭（Cofounder）：给你的想法做心肺复苏
          </Text>

          <View className='defib-steps'>
            <View className='d-step'>
              <Text className='d-num'>01</Text>
              <Text className='d-title'>发布</Text>
              <Text className='d-desc'>你的想法或你的能力，3分钟填完</Text>
            </View>
            <View className='d-step'>
              <Text className='d-num'>02</Text>
              <Text className='d-title'>匹配</Text>
              <Text className='d-desc'>按行业×技术精准配对，不是大海捞针</Text>
            </View>
            <View className='d-step'>
              <Text className='d-num'>03</Text>
              <Text className='d-title'>做MVP</Text>
              <Text className='d-desc'>一起做最小产品原型，验证合作默契</Text>
            </View>
            <View className='d-step'>
              <Text className='d-num'>04</Text>
              <Text className='d-title'>合伙</Text>
              <Text className='d-desc'>靠谱了再谈股权，不靠谱就分开，零成本</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ===== VITALS — 你得到什么 ===== */}
      <View className='section section-vitals'>
        <View className='section-inner'>
          <Text className='section-headline'>
            不是找一个人。{'\n'}是救活一个想法。
          </Text>

          <View className='vitals-grid'>
            <View className='vital'>
              <Text className='vital-icon'>🎯</Text>
              <Text className='vital-text'>精准匹配，不是盲目社交</Text>
            </View>
            <View className='vital'>
              <Text className='vital-icon'>🤝</Text>
              <Text className='vital-text'>合伙人关系，不是甲方乙方</Text>
            </View>
            <View className='vital'>
              <Text className='vital-icon'>🛡️</Text>
              <Text className='vital-text'>先验证再承诺，试错成本为零</Text>
            </View>
            <View className='vital'>
              <Text className='vital-icon'>⚡</Text>
              <Text className='vital-text'>最快一天找到搭档</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ===== PULSE — 数据 ===== */}
      {(projects.length > 0 || developers.length > 0) && (
        <View className='section section-pulse'>
          <View className='section-inner'>
            <Text className='pulse-headline'>此刻，正在发生</Text>
            <View className='pulse-stats'>
              {projects.length > 0 && (
                <View className='pulse-stat'>
                  <Text className='pulse-num'>{projects.length}+</Text>
                  <Text className='pulse-label'>个想法在等程序员</Text>
                </View>
              )}
              {developers.length > 0 && (
                <View className='pulse-stat'>
                  <Text className='pulse-num'>{developers.length}+</Text>
                  <Text className='pulse-label'>个程序员在等想法</Text>
                </View>
              )}
            </View>
            <Text className='pulse-cta-text'>他们已经开始了。你呢？</Text>
          </View>
        </View>
      )}

      {/* ===== CTA — 留邮箱 ===== */}
      <View className='section section-cta'>
        <View className='section-inner'>
          {!submitted ? (
            <View className='cta-box'>
              <Text className='cta-headline'>
                别让你的想法死在脑子里。
              </Text>
              <Text className='cta-subtitle'>留下邮箱，30秒注册，今天就开始。</Text>

              <View className='cta-form'>
                <View className='role-selector'>
                  <View
                    className={`role-chip ${selectedRole === 'project_owner' ? 'active' : ''}`}
                    onClick={() => setSelectedRole('project_owner')}
                  >
                    <Text className='role-chip-text'>💼 项目方</Text>
                  </View>
                  <View
                    className={`role-chip ${selectedRole === 'developer' ? 'active' : ''}`}
                    onClick={() => setSelectedRole('developer')}
                  >
                    <Text className='role-chip-text'>💻 程序员</Text>
                  </View>
                </View>

                <View className='email-row'>
                  <Input
                    className='email-input'
                    type='text'
                    placeholder='your@email.com'
                    value={email}
                    onInput={(e) => setEmail(e.detail.value)}
                    placeholderStyle='color: #475569;'
                  />
                  <View className='email-btn' onClick={handleEmailSubmit}>
                    <Text className='email-btn-text'>开始 →</Text>
                  </View>
                </View>
                <Text className='cta-note'>免费 · 无需密码 · 验证码登录</Text>
              </View>
            </View>
          ) : (
            <View className='cta-success'>
              <Text className='success-icon'>💓</Text>
              <Text className='success-text'>有心跳了。正在跳转...</Text>
            </View>
          )}
        </View>
      </View>

      {/* ===== Footer ===== */}
      <View className='footer'>
        <Text className='footer-brand'>叩饭（Cofounder）</Text>
        <Text className='footer-copy'>© 2026 HeHuoZao</Text>
      </View>
    </View>
  )
}
