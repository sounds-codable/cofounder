import { View, Text, Input, Textarea, Button, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { storage } from '@/utils/storage'
import { userApi, projectApi } from '@/services/api'
import {
  INDUSTRIES,
  TECH_DIRECTIONS,
  EDUCATION_OPTIONS,
  EMPLOYMENT_STATUS,
  WEEKLY_HOURS,
  PROVIDE_RESOURCES,
} from '@/utils/constants'
import './detail.scss'

export default function EditDetailedProfile() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'project' | 'profile'>('project')

  // ========== 项目方：创建项目的字段 ==========
  const [projectTitle, setProjectTitle] = useState('')
  const [projectIndustry, setProjectIndustry] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [targetUsers, setTargetUsers] = useState('')
  const [whySucceed, setWhySucceed] = useState('')
  const [techNeeds, setTechNeeds] = useState<string[]>([])
  const [techNotes, setTechNotes] = useState('')
  const [mvpPlan, setMvpPlan] = useState('')
  const [cooperationNotes, setCooperationNotes] = useState('')

  // ========== 通用：详细资料字段 ==========
  const [realName, setRealName] = useState('')
  const [phone, setPhone] = useState('')
  const [wechat, setWechat] = useState('')
  const [city, setCity] = useState('')
  const [education, setEducation] = useState('')
  const [school, setSchool] = useState('')
  const [major, setMajor] = useState('')
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [employmentStatus, setEmploymentStatus] = useState('')
  const [workYears, setWorkYears] = useState('')
  const [workExperienceDesc, setWorkExperienceDesc] = useState('')

  // ========== 项目方专属详细资料 ==========
  const [industryResources, setIndustryResources] = useState('')
  const [relatedExperience, setRelatedExperience] = useState('')
  const [canProvide, setCanProvide] = useState<string[]>([])

  // ========== 程序员专属详细资料 ==========
  const [techStack, setTechStack] = useState('')
  const [github, setGithub] = useState('')
  const [detailedProjects, setDetailedProjects] = useState('')
  const [interestedIndustries, setInterestedIndustries] = useState<string[]>([])
  const [weeklyHours, setWeeklyHours] = useState('')

  const hydrateFormFromUser = (currentUser: any) => {
    if (!currentUser) return

    setUser(currentUser)
    if (currentUser.role === 'developer') {
      setStep('profile')
    }

    if (currentUser.realName) setRealName(currentUser.realName)
    if (currentUser.phone) setPhone(currentUser.phone)
    if (currentUser.wechat) setWechat(currentUser.wechat)
    if (currentUser.city) setCity(currentUser.city)
    if (currentUser.education) setEducation(currentUser.education)
    if (currentUser.school) setSchool(currentUser.school)
    if (currentUser.major) setMajor(currentUser.major)
    if (currentUser.company) setCompany(currentUser.company)
    if (currentUser.position) setPosition(currentUser.position)
    if (currentUser.employmentStatus) setEmploymentStatus(currentUser.employmentStatus)
    if (currentUser.workYears) setWorkYears(String(currentUser.workYears))
    if (currentUser.workExperienceDesc) setWorkExperienceDesc(currentUser.workExperienceDesc)
    if (currentUser.industryResources) setIndustryResources(currentUser.industryResources)
    if (currentUser.relatedExperience) setRelatedExperience(currentUser.relatedExperience)
    if (currentUser.canProvide) setCanProvide(currentUser.canProvide)
    if (currentUser.techStack) setTechStack(currentUser.techStack)
    if (currentUser.github) setGithub(currentUser.github)
    if (currentUser.detailedProjects) setDetailedProjects(currentUser.detailedProjects)
    if (currentUser.interestedIndustries) setInterestedIndustries(currentUser.interestedIndustries)
    if (currentUser.weeklyHours) setWeeklyHours(currentUser.weeklyHours)
  }

  useEffect(() => {
    const currentUser = storage.getUser()
    if (currentUser) hydrateFormFromUser(currentUser)

    userApi.getProfile()
      .then((latestUser) => {
        if (!latestUser) return
        storage.setUser(latestUser)
        hydrateFormFromUser(latestUser)
      })
      .catch(() => {
        // 保持本地缓存回填，避免首次进入表单空白
      })
  }, [])

  const toggleTech = (tech: string) => {
    setTechNeeds(prev =>
      prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
    )
  }

  const toggleProvide = (item: string) => {
    setCanProvide(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    )
  }

  const toggleIndustry = (item: string) => {
    setInterestedIndustries(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    )
  }

  // 项目方：先创建项目，再填详细资料
  const handleCreateProject = async () => {
    if (!projectTitle) {
      Taro.showToast({ title: '请填写项目名称', icon: 'none' }); return
    }
    if (!projectIndustry) {
      Taro.showToast({ title: '请选择所属行业', icon: 'none' }); return
    }
    if (!projectDesc || projectDesc.length < 50) {
      Taro.showToast({ title: '项目介绍至少50个字符', icon: 'none' }); return
    }
    if (!targetUsers) {
      Taro.showToast({ title: '请填写目标用户', icon: 'none' }); return
    }
    if (!whySucceed || whySucceed.length < 50) {
      Taro.showToast({ title: '"为什么能成"至少50个字符', icon: 'none' }); return
    }
    if (techNeeds.length === 0) {
      Taro.showToast({ title: '请选择需要的技术能力', icon: 'none' }); return
    }
    if (!mvpPlan) {
      Taro.showToast({ title: '请填写MVP计划', icon: 'none' }); return
    }

    setLoading(true)
    try {
      await projectApi.create({
        title: projectTitle,
        industry: projectIndustry,
        description: projectDesc,
        targetUsers,
        whySucceed,
        techNeeds,
        techNotes,
        mvpPlan,
        cooperationNotes,
      })
      Taro.showToast({ title: '项目发布成功！接下来完善您的个人资料', icon: 'success' })
      setTimeout(() => setStep('profile'), 1000)
    } catch (error: any) {
      Taro.showToast({ title: error.message || '发布失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 保存详细资料
  const handleSaveProfile = async () => {
    if (!realName) {
      Taro.showToast({ title: '请填写真实姓名', icon: 'none' }); return
    }
    if (!phone) {
      Taro.showToast({ title: '请填写手机号', icon: 'none' }); return
    }
    if (!wechat) {
      Taro.showToast({ title: '请填写微信号', icon: 'none' }); return
    }
    if (!city) {
      Taro.showToast({ title: '请填写所在城市', icon: 'none' }); return
    }
    if (!education) {
      Taro.showToast({ title: '请选择最高学历', icon: 'none' }); return
    }
    if (!employmentStatus) {
      Taro.showToast({ title: '请选择在职状态', icon: 'none' }); return
    }

    setLoading(true)
    try {
      let updatedUser: any = null

      if (user?.role === 'project_owner') {
        if (!industryResources || industryResources.length < 100) {
          Taro.showToast({ title: '行业资源描述至少100个字符', icon: 'none' })
          setLoading(false); return
        }
        if (canProvide.length === 0) {
          Taro.showToast({ title: '请选择能提供的资源', icon: 'none' })
          setLoading(false); return
        }

        updatedUser = await userApi.updateDetailedProfile({
          realName, phone, wechat, city, education, school, major,
          company, position, employmentStatus, workYears, workExperienceDesc,
          industryResources, relatedExperience, canProvide,
        })
      } else {
        if (!techStack) {
          Taro.showToast({ title: '请填写技术栈', icon: 'none' })
          setLoading(false); return
        }
        if (!detailedProjects) {
          Taro.showToast({ title: '请填写详细项目经历', icon: 'none' })
          setLoading(false); return
        }
        if (interestedIndustries.length === 0) {
          Taro.showToast({ title: '请选择感兴趣的行业方向', icon: 'none' })
          setLoading(false); return
        }
        if (!weeklyHours) {
          Taro.showToast({ title: '请选择每周可投入时间', icon: 'none' })
          setLoading(false); return
        }

        updatedUser = await userApi.updateDetailedProfile({
          realName, phone, wechat, city, education, school, major,
          company, position, employmentStatus, workYears, workExperienceDesc,
          techStack, github, detailedProjects, interestedIndustries, weeklyHours,
        })
      }

      try {
        const contactUpdatedUser = await userApi.updateContactMethods({
          phone,
          wechat,
          email: user?.email,
        })
        if (contactUpdatedUser) {
          updatedUser = contactUpdatedUser
        }
      } catch (_contactError) {
        // 联系方式同步失败不影响已保存的详细资料，避免用户重复填写
      }

      if (updatedUser) {
        updatedUser = {
          ...updatedUser,
          realName,
          phone,
          wechat,
          city,
          education,
          school,
          major,
          company,
          position,
          employmentStatus,
          workYears,
          workExperienceDesc,
          industryResources,
          relatedExperience,
          canProvide,
          techStack,
          github,
          detailedProjects,
          interestedIndustries,
          weeklyHours,
        }
        storage.setUser(updatedUser)
        setUser(updatedUser)
      }

      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1000)
    } catch (error: any) {
      Taro.showToast({ title: error.message || '保存失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  // ========== 项目方 - 创建项目表单 ==========
  if (user.role === 'project_owner' && step === 'project') {
    return (
      <View className='edit-detail'>
        <View className='form'>
          <Text className='form-title'>发布您的项目</Text>
          <Text className='form-subtitle'>填写项目信息，吸引优秀的程序员合伙</Text>

          <View className='form-item'>
            <Text className='form-label'>项目名称 *</Text>
            <Input className='form-input' placeholder='给项目起个名字（最多50字）'
              maxlength={50} value={projectTitle}
              onInput={(e) => setProjectTitle(e.detail.value)} />
          </View>

          <View className='form-item'>
            <Text className='form-label'>所属行业 *</Text>
            <Picker mode='selector' range={INDUSTRIES}
              onChange={(e) => setProjectIndustry(INDUSTRIES[Number(e.detail.value)])}>
              <View className='form-picker'>{projectIndustry || '请选择行业'}</View>
            </Picker>
          </View>

          <View className='form-item'>
            <Text className='form-label'>项目介绍 *（至少50字）</Text>
            <Textarea className='form-textarea' placeholder='详细描述您的项目想法、商业模式等...'
              maxlength={500} value={projectDesc}
              onInput={(e) => setProjectDesc(e.detail.value)} />
            <Text className='form-counter'>{projectDesc.length}/500</Text>
          </View>

          <View className='form-item'>
            <Text className='form-label'>目标用户 *</Text>
            <Input className='form-input' placeholder='这个产品是给谁用的？'
              value={targetUsers} onInput={(e) => setTargetUsers(e.detail.value)} />
          </View>

          <View className='form-item'>
            <Text className='form-label'>为什么这个项目能成 *（至少50字）</Text>
            <Textarea className='form-textarea' placeholder='描述你的竞争优势、行业洞察、已有资源等...'
              maxlength={500} value={whySucceed}
              onInput={(e) => setWhySucceed(e.detail.value)} />
            <Text className='form-counter'>{whySucceed.length}/500</Text>
          </View>

          <View className='form-item'>
            <Text className='form-label'>需要的技术能力 *（可多选）</Text>
            <View className='tag-group'>
              {TECH_DIRECTIONS.map((tech) => (
                <View key={tech}
                  className={`tag ${techNeeds.includes(tech) ? 'active' : ''}`}
                  onClick={() => toggleTech(tech)}>{tech}</View>
              ))}
            </View>
          </View>

          <View className='form-item'>
            <Text className='form-label'>技术补充说明</Text>
            <Input className='form-input' placeholder='对技术需求的额外说明（可选）'
              value={techNotes} onInput={(e) => setTechNotes(e.detail.value)} />
          </View>

          <View className='form-item'>
            <Text className='form-label'>MVP计划 *</Text>
            <Textarea className='form-textarea' placeholder='您希望先做一个什么样的MVP来验证想法？'
              value={mvpPlan} onInput={(e) => setMvpPlan(e.detail.value)} />
          </View>

          <View className='form-item'>
            <Text className='form-label'>合作说明</Text>
            <Textarea className='form-textarea' placeholder='对合作方式的期望、股权分配想法等（可选）'
              value={cooperationNotes} onInput={(e) => setCooperationNotes(e.detail.value)} />
          </View>
        </View>

        <View className='action-bar'>
          <Button className='btn-save' loading={loading} onClick={handleCreateProject}>
            发布项目并继续完善资料
          </Button>
        </View>
      </View>
    )
  }

  // ========== 详细个人资料表单（项目方和程序员共用） ==========
  return (
    <View className='edit-detail'>
      <View className='form'>
        <Text className='form-title'>完善详细资料</Text>
        <Text className='form-subtitle'>
          完善资料后才能发送/接受合伙请求，联系方式仅在双方同意后可见
        </Text>

        {/* 基本联系方式 */}
        <View className='form-section-title'>📋 基本信息</View>

        <View className='form-item'>
          <Text className='form-label'>真实姓名 *</Text>
          <Input className='form-input' placeholder='您的真实姓名'
            value={realName} onInput={(e) => setRealName(e.detail.value)} />
        </View>

        <View className='form-item'>
          <Text className='form-label'>手机号 *</Text>
          <Input className='form-input' type='number' placeholder='您的手机号'
            value={phone} onInput={(e) => setPhone(e.detail.value)} />
        </View>

        <View className='form-item'>
          <Text className='form-label'>微信号 *</Text>
          <Input className='form-input' placeholder='您的微信号'
            value={wechat} onInput={(e) => setWechat(e.detail.value)} />
        </View>

        <View className='form-item'>
          <Text className='form-label'>所在城市 *</Text>
          <Input className='form-input' placeholder='如：北京'
            value={city} onInput={(e) => setCity(e.detail.value)} />
        </View>

        <View className='form-item'>
          <Text className='form-label'>最高学历 *</Text>
          <Picker mode='selector' range={EDUCATION_OPTIONS}
            value={EDUCATION_OPTIONS.indexOf(education)}
            onChange={(e) => setEducation(EDUCATION_OPTIONS[Number(e.detail.value)])}>
            <View className='form-picker'>{education || '请选择学历'}</View>
          </Picker>
        </View>

        <View className='form-item'>
          <Text className='form-label'>学校</Text>
          <Input className='form-input' placeholder='毕业院校（可选）'
            value={school} onInput={(e) => setSchool(e.detail.value)} />
        </View>

        <View className='form-item'>
          <Text className='form-label'>专业</Text>
          <Input className='form-input' placeholder='所学专业（可选）'
            value={major} onInput={(e) => setMajor(e.detail.value)} />
        </View>

        {/* 工作信息 */}
        <View className='form-section-title'>💼 工作信息</View>

        <View className='form-item'>
          <Text className='form-label'>工作单位 *</Text>
          <Input className='form-input' placeholder='现任或前任公司名称'
            value={company} onInput={(e) => setCompany(e.detail.value)} />
        </View>

        <View className='form-item'>
          <Text className='form-label'>职位 *</Text>
          <Input className='form-input' placeholder='您的职位/岗位'
            value={position} onInput={(e) => setPosition(e.detail.value)} />
        </View>

        <View className='form-item'>
          <Text className='form-label'>在职状态 *</Text>
          <Picker mode='selector' range={EMPLOYMENT_STATUS}
            value={EMPLOYMENT_STATUS.indexOf(employmentStatus)}
            onChange={(e) => setEmploymentStatus(EMPLOYMENT_STATUS[Number(e.detail.value)])}>
            <View className='form-picker'>{employmentStatus || '请选择在职状态'}</View>
          </Picker>
        </View>

        <View className='form-item'>
          <Text className='form-label'>工作年限</Text>
          <Input className='form-input' type='number' placeholder='如：3'
            value={workYears} onInput={(e) => setWorkYears(e.detail.value)} />
        </View>

        <View className='form-item'>
          <Text className='form-label'>工作经历描述</Text>
          <Textarea className='form-textarea' placeholder='简要描述工作经历（可选）'
            maxlength={500} value={workExperienceDesc}
            onInput={(e) => setWorkExperienceDesc(e.detail.value)} />
        </View>

        {/* 项目方专属 */}
        {user.role === 'project_owner' && (
          <>
            <View className='form-section-title'>🏭 行业资源</View>

            <View className='form-item'>
              <Text className='form-label'>行业资源描述 *（至少100字）</Text>
              <Textarea className='form-textarea form-textarea-large'
                placeholder='描述您在行业内拥有的资源、人脉、渠道等...'
                maxlength={300} value={industryResources}
                onInput={(e) => setIndustryResources(e.detail.value)} />
              <Text className='form-counter'>{industryResources.length}/300</Text>
            </View>

            <View className='form-item'>
              <Text className='form-label'>相关行业经历</Text>
              <Textarea className='form-textarea' placeholder='过去在该行业的工作经历（可选）'
                maxlength={300} value={relatedExperience}
                onInput={(e) => setRelatedExperience(e.detail.value)} />
            </View>

            <View className='form-item'>
              <Text className='form-label'>能提供的资源 *（可多选）</Text>
              <View className='tag-group'>
                {PROVIDE_RESOURCES.map((item) => (
                  <View key={item}
                    className={`tag ${canProvide.includes(item) ? 'active' : ''}`}
                    onClick={() => toggleProvide(item)}>{item}</View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* 程序员专属 */}
        {user.role === 'developer' && (
          <>
            <View className='form-section-title'>🛠 技术能力</View>

            <View className='form-item'>
              <Text className='form-label'>技术栈 *</Text>
              <Input className='form-input' placeholder='如：React, Node.js, Python, PostgreSQL'
                value={techStack} onInput={(e) => setTechStack(e.detail.value)} />
            </View>

            <View className='form-item'>
              <Text className='form-label'>GitHub</Text>
              <Input className='form-input' placeholder='您的GitHub主页（可选）'
                value={github} onInput={(e) => setGithub(e.detail.value)} />
            </View>

            <View className='form-item'>
              <Text className='form-label'>详细项目经历 *</Text>
              <Textarea className='form-textarea form-textarea-large'
                placeholder='描述参与过的代表性项目，包括技术栈、角色和成果...'
                value={detailedProjects}
                onInput={(e) => setDetailedProjects(e.detail.value)} />
            </View>

            <View className='form-item'>
              <Text className='form-label'>感兴趣的行业方向 *（可多选）</Text>
              <View className='tag-group'>
                {INDUSTRIES.map((item) => (
                  <View key={item}
                    className={`tag ${interestedIndustries.includes(item) ? 'active' : ''}`}
                    onClick={() => toggleIndustry(item)}>{item}</View>
                ))}
              </View>
            </View>

            <View className='form-item'>
              <Text className='form-label'>每周可投入时间 *</Text>
              <Picker mode='selector' range={WEEKLY_HOURS}
                value={WEEKLY_HOURS.indexOf(weeklyHours)}
                onChange={(e) => setWeeklyHours(WEEKLY_HOURS[Number(e.detail.value)])}>
                <View className='form-picker'>{weeklyHours || '请选择'}</View>
              </Picker>
            </View>
          </>
        )}
      </View>

      <View className='action-bar'>
        <Button className='btn-save' loading={loading} onClick={handleSaveProfile}>
          保存资料
        </Button>
      </View>
    </View>
  )
}
