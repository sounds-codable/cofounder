var api = require('../../utils/api');

Page({
  data: {
    role: 'expert',
    isEdit: false,
    headline: '',
    basicSummary: '',
    city: '',
    desiredDirection: '',
    strengthsText: '',
    submitting: false,
    errMsg: '',
  },

  onLoad: function (options) {
    var role = options.role || 'expert';
    var isEdit = options.edit === '1';
    this.setData({ role: role, isEdit: isEdit });

    if (isEdit) {
      this.loadExisting();
    }
  },

  loadExisting: function () {
    var that = this;
    api
      .fetchMe()
      .then(function (profile) {
        if (profile && profile.card) {
          var c = profile.card;
          that.setData({
            headline: c.headline || '',
            basicSummary: c.basicSummary || '',
            city: c.city || '',
            desiredDirection: c.desiredDirection || '',
            strengthsText: (c.strengths || []).join(', '),
          });
        }
      })
      .catch(function () {});
  },

  onInput: function (e) {
    var field = e.currentTarget.dataset.field;
    var obj = {};
    obj[field] = e.detail.value;
    obj.errMsg = '';
    this.setData(obj);
  },

  onStrengthsInput: function (e) {
    this.setData({ strengthsText: e.detail.value, errMsg: '' });
  },

  submit: function () {
    var headline = this.data.headline.trim();
    var basicSummary = this.data.basicSummary.trim();
    var city = this.data.city.trim();

    if (!headline) {
      this.setData({ errMsg: '请填写标题' });
      return;
    }
    if (!basicSummary) {
      this.setData({ errMsg: '请填写简要描述' });
      return;
    }

    var strengths = this.data.strengthsText
      .split(/[,，]/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);

    var body = {
      role: this.data.role,
      headline: headline,
      basicSummary: basicSummary,
      city: city,
      strengths: strengths,
    };

    if (this.data.role === 'expert' && this.data.desiredDirection.trim()) {
      body.desiredDirection = this.data.desiredDirection.trim();
    }

    var that = this;
    this.setData({ submitting: true, errMsg: '' });

    var app = getApp();
    var profile = app.globalData.userInfo;
    var promise;

    if (this.data.isEdit && profile && profile.card) {
      promise = api.updateMyCardBasic(profile.card.id, body);
    } else {
      promise = api.saveBasicProfile(body);
    }

    promise
      .then(function () {
        that.setData({ submitting: false });
        app.checkLogin();
        wx.showToast({ title: that.data.isEdit ? '保存成功' : '发布成功', icon: 'success' });
        setTimeout(function () {
          wx.navigateBack();
        }, 800);
      })
      .catch(function (err) {
        that.setData({ submitting: false, errMsg: err.message || '提交失败' });
      });
  },
});
