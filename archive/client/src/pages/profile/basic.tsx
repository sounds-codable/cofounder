import { View, Text, Input, Textarea, Button, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { storage } from '@/utils/storage'
import { userApi } from '@/services/api'
import { INDUSTRIES, TECH_DIRECTIONS, WEEKLY_HOURS } from '@/utils/constants'
import './basic.scss'

export default function EditBasicProfile() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [weeklyHours, setWeeklyHours] = useState('')
  const [industry, setIndustry] = useState('')
  const [techDirections, setTechDirections] = useState<string[]>([])
  const [workYears, setWorkYears] = useState('')

  useEffect(() => {
    const currentUser = storage.getUser()
    if (currentUser) {
      setUser(currentUser)
      setNickname(currentUser.nickname || '')
      setBio(currentUser.bio || '')
      setWeeklyHours(currentUser.weeklyHours || '')
      setIndustry(currentUser.industry || '')
      setTechDirections(currentUser.techDirections || [])
      setWorkYears(currentUser.workYears?.toString() || '')
    }
  }, [])

  const toggleTechDirection = (tech: string) => {
    setTechDirections(prev => 
      prev.includes(tech) 
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    )
  }

  const handleSave = async () => {
    if (!nickname) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const data = user?.role === 'project_owner' 
        ? { nickname, bio, weeklyHours, industry }
        : { nickname, bio, weeklyHours, techDirections, workYears: Number(workYears) }
      
      const result = await userApi.updateBasicProfile(data)
      const merged = {
        ...result,
        weeklyHours: weeklyHours || result?.weeklyHours || '',
        workYears: user?.role === 'developer' ? (workYears || result?.workYears || '') : result?.workYears,
      }
      storage.setUser(merged)
      
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1000)
    } catch (error: any) {
      Taro.showToast({ title: error.message || '保存失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <View className='edit-basic'>
      <View className='form'>
        <View className='form-item'>
          <Text className='form-label'>昵称</Text>
          <Input
            className='form-input'
            placeholder='您的昵称'
            value={nickname}
            onInput={(e) => setNickname(e.detail.value)}
          />
        </View>

        <View className='form-item'>
          <Text className='form-label'>个人简介</Text>
          <Textarea
            className='form-textarea'
            placeholder='简单介绍一下自己...'
            value={bio}
            onInput={(e) => setBio(e.detail.value)}
          />
        </View>

        <View className='form-item'>
          <Text className='form-label'>每周可投入时间</Text>
          <Picker
            mode='selector'
            range={WEEKLY_HOURS}
            value={WEEKLY_HOURS.indexOf(weeklyHours)}
            onChange={(e) => setWeeklyHours(WEEKLY_HOURS[Number(e.detail.value)])}
          >
            <View className='form-picker'>
              {weeklyHours || '请选择'}
            </View>
          </Picker>
        </View>

        {user.role === 'project_owner' && (
          <View className='form-item'>
            <Text className='form-label'>行业领域</Text>
            <Picker
              mode='selector'
              range={INDUSTRIES}
              value={INDUSTRIES.indexOf(industry)}
              onChange={(e) => setIndustry(INDUSTRIES[Number(e.detail.value)])}
            >
              <View className='form-picker'>
                {industry || '请选择行业'}
              </View>
            </Picker>
          </View>
        )}

        {user.role === 'developer' && (
          <>
            <View className='form-item'>
              <Text className='form-label'>技术方向</Text>
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
              <Text className='form-label'>工作年限</Text>
              <Input
                className='form-input'
                type='number'
                placeholder='如：5'
                value={workYears}
                onInput={(e) => setWorkYears(e.detail.value)}
              />
            </View>
          </>
        )}

        <Button
          className='btn-save'
          loading={loading}
          onClick={handleSave}
        >
          保存
        </Button>
      </View>
    </View>
  )
}

