var api = require('../../utils/api');
var util = require('../../utils/util');

Page({
  data: {
    loggedIn: false,
    displayName: '',
    displayNameInput: '',
    email: '',
    avatarLetter: '',
    myCard: null,
    hasDetailProfile: false,
    phone: '',
    wechat: '',
    qq: '',
    contactEmail: '',
    other: '',
    savingName: false,
    savingContacts: false,
  },

  onShow: function () {
    var loggedIn = util.isLoggedIn();
    this.setData({ loggedIn: loggedIn });
    if (loggedIn) {
      this.loadProfile();
    }
  },

  loadProfile: function () {
    var that = this;
    api
      .fetchMe()
      .then(function (profile) {
        var app = getApp();
        app.globalData.userInfo = profile;

        var user = profile.user || profile;
        var name = user.displayName || '';
        var email = user.email || '';

        var contacts = profile.contactMethods || [];
        var phone = '';
        var wechat = '';
        var qq = '';
        var contactEmail = '';
        var other = '';
        contacts.forEach(function (c) {
          if (c.type === 'phone') phone = c.value;
          else if (c.type === 'wechat') wechat = c.value;
          else if (c.type === 'qq') qq = c.value;
          else if (c.type === 'email') contactEmail = c.value;
          else if (c.type === 'other') other = c.value;
        });

        that.setData({
          displayName: name,
          displayNameInput: name,
          email: email,
          avatarLetter: (name || email || '?')[0].toUpperCase(),
          myCard: profile.card || null,
          hasDetailProfile: profile.completion ? profile.completion.hasDetailProfile : false,
          phone: phone,
          wechat: wechat,
          qq: qq,
          contactEmail: contactEmail,
          other: other,
        });
      })
      .catch(function () {});
  },

  onDisplayNameInput: function (e) {
    this.setData({ displayNameInput: e.detail.value });
  },

  saveDisplayName: function () {
    var name = this.data.displayNameInput.trim();
    if (!name) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    var that = this;
    this.setData({ savingName: true });
    api
      .saveDisplayName(name)
      .then(function () {
        that.setData({ savingName: false, displayName: name });
        wx.showToast({ title: '昵称已保存', icon: 'success' });
        getApp().checkLogin();
      })
      .catch(function (err) {
        that.setData({ savingName: false });
        wx.showToast({ title: err.message || '保存失败', icon: 'none' });
      });
  },

  onContactInput: function (e) {
    var field = e.currentTarget.dataset.field;
    var obj = {};
    obj[field] = e.detail.value;
    this.setData(obj);
  },

  saveContacts: function () {
    var body = {};
    if (this.data.phone.trim()) body.phone = this.data.phone.trim();
    if (this.data.wechat.trim()) body.wechat = this.data.wechat.trim();
    if (this.data.qq.trim()) body.qq = this.data.qq.trim();
    if (this.data.contactEmail.trim()) body.email = this.data.contactEmail.trim();
    if (this.data.other.trim()) body.other = this.data.other.trim();

    if (Object.keys(body).length === 0) {
      wx.showToast({ title: '请至少填写一项', icon: 'none' });
      return;
    }

    var that = this;
    this.setData({ savingContacts: true });
    api
      .saveContactMethods(body)
      .then(function () {
        that.setData({ savingContacts: false });
        wx.showToast({ title: '联系方式已保存', icon: 'success' });
        getApp().checkLogin();
      })
      .catch(function (err) {
        that.setData({ savingContacts: false });
        wx.showToast({ title: err.message || '保存失败', icon: 'none' });
      });
  },

  goLogin: function () {
    wx.navigateTo({ url: '/pages/login/index' });
  },

  goEditCard: function () {
    var card = this.data.myCard;
    if (!card) return;
    wx.navigateTo({ url: '/pages/publish/index?role=' + card.role + '&edit=1' });
  },

  goCardDetail: function () {
    var card = this.data.myCard;
    if (!card) return;
    wx.navigateTo({ url: '/pages/card-detail/index?id=' + card.id });
  },

  goDetailProfile: function () {
    wx.navigateTo({ url: '/pages/detail-profile/index' });
  },

  logout: function () {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: function (res) {
        if (res.confirm) {
          api.clearToken();
          var app = getApp();
          app.globalData.userInfo = null;
          app.globalData.engagements = null;
          wx.reLaunch({ url: '/pages/projects/index' });
        }
      },
    });
  },
});
