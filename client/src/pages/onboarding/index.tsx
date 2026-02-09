import { View, Text, Input, Textarea, Button, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { storage } from '@/utils/storage'
import { userApi } from '@/services/api'
import { INDUSTRIES, TECH_DIRECTIONS } from '@/utils/constants'
import './index.scss'

export default function Onboarding() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  // 通用字段
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  
  // 项目方专属
  const [industry, setIndustry] = useState('')
  const [industryExperience, setIndustryExperience] = useState('')
  
  // 程序员专属
  const [techDirections, setTechDirections] = useState<string[]>([])
  const [workYears, setWorkYears] = useState('')
  const [projectExperience, setProjectExperience] = useState('')

  useEffect(() => {
    const currentUser = storage.getUser()
    if (!currentUser) {
      Taro.redirectTo({ url: '/pages/login/index' })
      return
    }
    setUser(currentUser)
  }, [])

  const toggleTechDirection = (tech: string) => {
    setTechDirections(prev => 
      prev.includes(tech) 
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    )
  }

  const handleSubmit = async () => {
    if (!nickname) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    if (!bio || bio.length < 50) {
      Taro.showToast({ title: '个人简介至少50个字符', icon: 'none' })
      return
    }

    if (user?.role === 'project_owner') {
      if (!industry) {
        Taro.showToast({ title: '请选择行业', icon: 'none' })
        return
      }
      // industryExperience 为可选字段，不再强制验证
    }

    if (user?.role === 'developer') {
      if (techDirections.length === 0) {
        Taro.showToast({ title: '请至少选择一个技术方向', icon: 'none' })
        return
      }
      if (!workYears) {
        Taro.showToast({ title: '请填写工作年限', icon: 'none' })
        return
      }
      if (!projectExperience || projectExperience.length < 100) {
        Taro.showToast({ title: '项目经历至少100个字符', icon: 'none' })
        return
      }
    }

    setLoading(true)
    try {
      const ownerData: any = { nickname, bio, industry }
      if (industryExperience) {
        ownerData.industryExperience = Number(industryExperience)
      }
      const data = user?.role === 'project_owner' 
        ? ownerData
        : { nickname, bio, techDirections, workYears: Number(workYears), projectExperience }
      
      const result = await userApi.updateBasicProfile(data)
      storage.setUser(result)
      
      Taro.showToast({ title: '资料完善成功', icon: 'success' })
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/projects/index' })
      }, 1000)
    } catch (error: any) {
      Taro.showToast({ title: error.message || '保存失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <View className='onboarding'>
      <View className='onboarding-header'>
        <Text className='onboarding-title'>完善您的基础资料</Text>
        <Text className='onboarding-subtitle'>
          这些信息将展示给潜在合伙人
        </Text>
      </View>

      <View className='form'>
        {/* 通用：昵称 */}
        <View className='form-item'>
          <Text className='form-label'>昵称 *</Text>
          <Input
            className='form-input'
            placeholder='您的昵称或称呼（最多20字）'
            maxlength={20}
            value={nickname}
            onInput={(e) => setNickname(e.detail.value)}
          />
        </View>

        {/* 通用：个人简介 */}
        <View className='form-item'>
          <Text className='form-label'>个人简介 *（至少50字）</Text>
          <Textarea
            className='form-textarea'
            placeholder='简单介绍一下自己，让合伙人更了解你...'
            maxlength={200}
            value={bio}
            onInput={(e) => setBio(e.detail.value)}
          />
          <Text className='form-counter'>{bio.length}/200</Text>
        </View>

        {/* 项目方：行业领域 */}
        {user.role === 'project_owner' && (
          <>
            <View className='form-item'>
              <Text className='form-label'>行业领域 *</Text>
              <Picker
                mode='selector'
                range={INDUSTRIES}
                onChange={(e) => setIndustry(INDUSTRIES[Number(e.detail.value)])}
              >
                <View className='form-picker'>
                  {industry || '请选择行业'}
                </View>
              </Picker>
            </View>

            <View className='form-item'>
              <Text className='form-label'>行业经验年限（选填）</Text>
              <Input
                className='form-input'
                type='number'
                placeholder='如：5'
                value={industryExperience}
                onInput={(e) => setIndustryExperience(e.detail.value)}
              />
            </View>
          </>
        )}

        {/* 程序员：技术方向 */}
        {user.role === 'developer' && (
          <>
            <View className='form-item'>
              <Text className='form-label'>技术方向 *（可多选）</Text>
              <View className='tag-group'>
                {TECH_DIRECTIONS.map((tech) => (
                  <View
                    key={tech}
                    className={`tag ${techDirections.includes(tech) ? 'active' : ''}`}
                    onClick={() => toggleTechDirection(tech)}
                  >
                    {tech}
                  </View>
                ))}
              </View>
            </View>

            <View className='form-item'>
              <Text className='form-label'>工作年限 *</Text>
              <Input
                className='form-input'
                type='number'
                placeholder='如：5'
                value={workYears}
                onInput={(e) => setWorkYears(e.detail.value)}
              />
            </View>

            <View className='form-item'>
              <Text className='form-label'>项目经历 *（至少100字）</Text>
              <Textarea
                className='form-textarea form-textarea-large'
                placeholder='描述您参与过的项目，包括技术栈、角色和成果...'
                maxlength={300}
                value={projectExperience}
                onInput={(e) => setProjectExperience(e.detail.value)}
              />
              <Text className='form-counter'>{projectExperience.length}/300</Text>
            </View>
          </>
        )}

        <Button
          className='btn-submit'
          loading={loading}
          onClick={handleSubmit}
        >
          完成并进入
        </Button>
      </View>
    </View>
  )
}
