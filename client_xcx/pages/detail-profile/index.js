var api = require('../../utils/api');

Page({
  data: {
    loading: true,
    role: 'expert',
    intro: '',
    education: '',
    experience: '',
    projectDetail: '',
    submitting: false,
    errMsg: '',
  },

  onLoad: function () {
    this.loadExisting();
  },

  loadExisting: function () {
    var that = this;
    api
      .fetchMe()
      .then(function (profile) {
        var user = profile.user || profile;
        var dp = user.detailedProfile || {};
        var role = (profile.card && profile.card.role) || 'expert';

        that.setData({
          loading: false,
          role: role,
          intro: dp.intro || '',
          education: dp.education || '',
          experience: dp.experience || '',
          projectDetail: dp.expertProjectDetail || dp.developerProjectExperience || dp.projectDetail || '',
        });
      })
      .catch(function () {
        that.setData({ loading: false });
      });
  },

  onInput: function (e) {
    var field = e.currentTarget.dataset.field;
    var obj = {};
    obj[field] = e.detail.value;
    obj.errMsg = '';
    this.setData(obj);
  },

  submit: function () {
    var that = this;
    var body = {
      intro: this.data.intro.trim(),
      education: this.data.education.trim(),
      experience: this.data.experience.trim(),
    };

    if (this.data.role === 'developer') {
      body.developerProjectExperience = this.data.projectDetail.trim();
    } else {
      body.expertProjectDetail = this.data.projectDetail.trim();
    }

    this.setData({ submitting: true, errMsg: '' });

    api
      .saveDetailProfile(body)
      .then(function () {
        that.setData({ submitting: false });
        getApp().checkLogin();
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(function () {
          wx.navigateBack();
        }, 800);
      })
      .catch(function (err) {
        that.setData({ submitting: false, errMsg: err.message || '保存失败' });
      });
  },
});
