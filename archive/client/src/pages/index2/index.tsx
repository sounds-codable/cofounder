import { View, Text, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { storage } from '@/utils/storage'
import { projectApi, developerApi } from '@/services/api'
import './index.scss'

export default function Index2() {
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
      Taro.showToast({ title: '请选择您的身份', icon: 'none' })
      return
    }
    setSubmitted(true)
    setTimeout(() => {
      Taro.navigateTo({ url: `/pages/login/index?role=${selectedRole}&email=${encodeURIComponent(email)}` })
    }, 800)
  }

  const handleDirectLogin = (role: string) => {
    Taro.navigateTo({ url: `/pages/login/index?role=${role}` })
  }

  return (
    <View className='landing'>

      {/* ========== HERO ========== */}
      <View className='hero'>
        <View className='hero-inner'>
          <View className='hero-badge'>
            <Text className='badge-text'>🚀 面向中国创业者</Text>
          </View>
          <Text className='hero-headline'>
            你有行业经验，{'\n'}
            却找不到靠谱的技术合伙人？
          </Text>
          <Text className='hero-sub'>
            你有技术能力，{'\n'}
            却不知道该做什么产品？
          </Text>
          <Text className='hero-desc'>
            叩饭（Cofounder），让行业专家和程序员以股权合伙的方式，
            把想法变成产品。不是雇佣，是合伙。
          </Text>

          {/* CTA inline */}
          <View className='hero-cta'>
            <View 
              className='cta-btn cta-primary'
              onClick={() => handleDirectLogin('project_owner')}
            >
              <Text className='cta-btn-text'>💼 我有项目想法</Text>
            </View>
            <View 
              className='cta-btn cta-secondary'
              onClick={() => handleDirectLogin('developer')}
            >
              <Text className='cta-btn-text'>💻 我是程序员</Text>
            </View>
          </View>

          <View className='hero-stats'>
            <View className='stat'>
              <Text className='stat-num'>{projects.length > 0 ? `${projects.length}+` : '—'}</Text>
              <Text className='stat-label'>项目在找合伙人</Text>
            </View>
            <View className='stat-divider' />
            <View className='stat'>
              <Text className='stat-num'>{developers.length > 0 ? `${developers.length}+` : '—'}</Text>
              <Text className='stat-label'>程序员在找项目</Text>
            </View>
          </View>
        </View>

        {/* gradient overlay at bottom */}
        <View className='hero-fade' />
      </View>

      {/* ========== WHY — 痛点 ========== */}
      <View className='section section-why'>
        <View className='section-inner'>
          <Text className='section-eyebrow'>WHY — 为什么需要叩饭（Cofounder）</Text>
          <Text className='section-headline'>
            创业最难的事，{'\n'}不是缺钱，是缺搭档
          </Text>

          <View className='pain-grid'>
            <View className='pain-card pain-owner'>
              <Text className='pain-icon'>💼</Text>
              <Text className='pain-role'>项目方的痛</Text>
              <View className='pain-list'>
                <Text className='pain-item'>❌ 外包做出来的产品，没有灵魂</Text>
                <Text className='pain-item'>❌ 雇全职开发，启动资金不够</Text>
                <Text className='pain-item'>❌ 找朋友帮忙，欠的人情还不起</Text>
                <Text className='pain-item'>❌ 行业资源丰富，但技术一窍不通</Text>
              </View>
            </View>
            <View className='pain-card pain-dev'>
              <Text className='pain-icon'>💻</Text>
              <Text className='pain-role'>程序员的痛</Text>
              <View className='pain-list'>
                <Text className='pain-item'>❌ 想创业，但不知道做什么产品</Text>
                <Text className='pain-item'>❌ 有技术，没有行业认知和资源</Text>
                <Text className='pain-item'>❌ 打工久了，想要股权而非工资</Text>
                <Text className='pain-item'>❌ 上班写的代码，永远不属于自己</Text>
              </View>
            </View>
          </View>

          <View className='why-conclusion'>
            <Text className='why-conclusion-text'>
              问题不在于"找不到人"，而在于——没有一个平台，
              让双方以合伙人（而非雇佣）的关系开始合作。
            </Text>
          </View>
        </View>
      </View>

      {/* ========== HOW — 方案 ========== */}
      <View className='section section-how'>
        <View className='section-inner'>
          <Text className='section-eyebrow'>HOW — 叩饭（Cofounder）怎么做</Text>
          <Text className='section-headline'>
            4步，从想法到合伙
          </Text>

          <View className='steps'>
            <View className='step-card'>
              <View className='step-number'><Text className='step-num-text'>1</Text></View>
              <View className='step-content'>
                <Text className='step-title'>发布你的想法或能力</Text>
                <Text className='step-desc'>
                  项目方描述你的创业想法、行业背景、需要什么样的技术合伙人。
                  程序员展示你的技术栈、项目经验、感兴趣的行业。
                </Text>
              </View>
            </View>

            <View className='step-connector' />

            <View className='step-card'>
              <View className='step-number step-n2'><Text className='step-num-text'>2</Text></View>
              <View className='step-content'>
                <Text className='step-title'>双向选择，精准匹配</Text>
                <Text className='step-desc'>
                  浏览对方的背景和能力，感兴趣就发起合作请求。
                  不是大海捞针，是有目标地找合伙人。
                </Text>
              </View>
            </View>

            <View className='step-connector' />

            <View className='step-card'>
              <View className='step-number step-n3'><Text className='step-num-text'>3</Text></View>
              <View className='step-content'>
                <Text className='step-title'>一起做MVP，验证默契</Text>
                <Text className='step-desc'>
                  先用最小成本做出产品原型，验证合作是否顺畅。
                  试错成本极低——不行就换，行就继续。
                </Text>
              </View>
            </View>

            <View className='step-connector' />

            <View className='step-card'>
              <View className='step-number step-n4'><Text className='step-num-text'>4</Text></View>
              <View className='step-content'>
                <Text className='step-title'>确认合伙，分配股权</Text>
                <Text className='step-desc'>
                  MVP验证通过后，根据各自贡献和能力，商定股权比例。
                  不是先谈钱，是先验证能不能一起做事。
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ========== WHAT — 你能得到什么 ========== */}
      <View className='section section-what'>
        <View className='section-inner'>
          <Text className='section-eyebrow'>WHAT — 你能得到什么</Text>
          <Text className='section-headline'>
            不只是找到一个人，{'\n'}是开启一段合伙关系
          </Text>

          <View className='benefit-grid'>
            <View className='benefit-card'>
              <Text className='benefit-icon'>🎯</Text>
              <Text className='benefit-title'>精准匹配</Text>
              <Text className='benefit-desc'>按行业、技术栈、兴趣方向匹配，不是盲目社交</Text>
            </View>
            <View className='benefit-card'>
              <Text className='benefit-icon'>🤝</Text>
              <Text className='benefit-title'>合伙人关系</Text>
              <Text className='benefit-desc'>不是甲方乙方，是平等的合伙人，共同持有股权</Text>
            </View>
            <View className='benefit-card'>
              <Text className='benefit-icon'>🛡️</Text>
              <Text className='benefit-title'>低风险验证</Text>
              <Text className='benefit-desc'>先做MVP再谈股权，合作不愉快随时退出</Text>
            </View>
            <View className='benefit-card'>
              <Text className='benefit-icon'>⚡</Text>
              <Text className='benefit-title'>快速启动</Text>
              <Text className='benefit-desc'>从注册到找到合伙人，最快一天内完成</Text>
            </View>
            <View className='benefit-card'>
              <Text className='benefit-icon'>💡</Text>
              <Text className='benefit-title'>资源互补</Text>
              <Text className='benefit-desc'>行业经验 + 技术能力，1+1 &gt; 2</Text>
            </View>
            <View className='benefit-card'>
              <Text className='benefit-icon'>🔒</Text>
              <Text className='benefit-title'>隐私保护</Text>
              <Text className='benefit-desc'>联系方式仅在双方同意后才会展示</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ========== SOCIAL PROOF ========== */}
      <View className='section section-proof'>
        <View className='section-inner'>
          <Text className='section-headline'>
            他们的故事，可能就是你的下一步
          </Text>
          <View className='story-grid'>
            <View className='story-card'>
              <Text className='story-quote'>
                "做了8年医疗器械，一直想做一个给医生用的排班工具。
                在叩饭（Cofounder）上找到了一个全栈工程师，两个月就上线了MVP。"
              </Text>
              <View className='story-author'>
                <Text className='story-avatar'>💼</Text>
                <View>
                  <Text className='story-name'>陈总 · 医疗器械行业</Text>
                  <Text className='story-role'>项目方</Text>
                </View>
              </View>
            </View>
            <View className='story-card'>
              <Text className='story-quote'>
                "在大厂写了5年代码，一直想自己做点什么。
                在这里认识了一个做供应链的老板，现在我们的SaaS已经有了10家付费客户。"
              </Text>
              <View className='story-author'>
                <Text className='story-avatar'>💻</Text>
                <View>
                  <Text className='story-name'>张工 · 全栈工程师</Text>
                  <Text className='story-role'>程序员</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ========== CTA — 留邮箱 ========== */}
      <View className='section section-cta'>
        <View className='section-inner'>
          <Text className='cta-headline'>
            {submitted 
              ? '🎉 正在跳转...' 
              : '准备好找你的合伙人了吗？'
            }
          </Text>
          {!submitted && (
            <Text className='cta-subtitle'>
              留下邮箱，30秒完成注册，开始寻找你的创业搭档
            </Text>
          )}

          {!submitted && (
            <View className='cta-form'>
              <View className='role-selector'>
                <View 
                  className={`role-chip ${selectedRole === 'project_owner' ? 'active' : ''}`}
                  onClick={() => setSelectedRole('project_owner')}
                >
                  <Text className='role-chip-text'>💼 我是项目方</Text>
                </View>
                <View 
                  className={`role-chip ${selectedRole === 'developer' ? 'active' : ''}`}
                  onClick={() => setSelectedRole('developer')}
                >
                  <Text className='role-chip-text'>💻 我是程序员</Text>
                </View>
              </View>

              <View className='email-row'>
                <Input
                  className='email-input'
                  type='text'
                  placeholder='your@email.com'
                  value={email}
                  onInput={(e) => setEmail(e.detail.value)}
                  placeholderStyle='color: #64748b;'
                />
                <View className='email-btn' onClick={handleEmailSubmit}>
                  <Text className='email-btn-text'>开始 →</Text>
                </View>
              </View>

              <Text className='cta-note'>无需密码，邮箱验证码登录，30秒搞定</Text>
            </View>
          )}

          {submitted && (
            <View className='cta-success'>
              <Text className='success-text'>正在为你跳转注册页面...</Text>
            </View>
          )}
        </View>
      </View>

      {/* ========== FAQ ========== */}
      <View className='section section-faq'>
        <View className='section-inner'>
          <Text className='section-headline'>常见问题</Text>
          <View className='faq-list'>
            <View className='faq-item'>
              <Text className='faq-q'>Q: 需要付费吗？</Text>
              <Text className='faq-a'>完全免费。我们希望帮更多人找到合伙人。</Text>
            </View>
            <View className='faq-item'>
              <Text className='faq-q'>Q: 股权怎么分配？</Text>
              <Text className='faq-a'>由合伙双方自行协商。我们建议先做MVP验证合作后再谈股权，平台不参与分配。</Text>
            </View>
            <View className='faq-item'>
              <Text className='faq-q'>Q: 我的信息安全吗？</Text>
              <Text className='faq-a'>你的联系方式（手机、微信等）只有在双方都同意合作后才会相互展示。</Text>
            </View>
            <View className='faq-item'>
              <Text className='faq-q'>Q: 合作不顺利怎么办？</Text>
              <Text className='faq-a'>MVP阶段没有任何法律约束，不合适就分开，试错成本极低。</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ========== Footer ========== */}
      <View className='footer'>
        <View className='footer-inner'>
          <Text className='footer-brand'>叩饭（Cofounder）</Text>
          <Text className='footer-tagline'>让创业合伙更简单</Text>
          <Text className='footer-copy'>© 2026 叩饭（Cofounder）. All rights reserved.</Text>
        </View>
      </View>
    </View>
  )
}
