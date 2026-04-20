var api = require('./utils/api');

App({
  globalData: {
    userInfo: null,
    engagements: null,
  },

  onLaunch: function () {
    this.checkLogin();
  },

  checkLogin: function () {
    var token = api.getToken();
    if (!token) return;
    var that = this;
    api
      .fetchMe()
      .then(function (res) {
        that.globalData.userInfo = res;
        that.loadEngagements();
      })
      .catch(function () {
        api.clearToken();
        that.globalData.userInfo = null;
      });
  },

  loadEngagements: function () {
    var that = this;
    api
      .fetchEngagements()
      .then(function (res) {
        that.globalData.engagements = res;
      })
      .catch(function () {});
  },

  isLiked: function (cardId) {
    var eng = this.globalData.engagements;
    if (!eng || !eng.likes) return false;
    if (Array.isArray(eng.likes)) {
      return eng.likes.some(function (item) {
        return typeof item === 'string' ? item === cardId : item.cardId === cardId;
      });
    }
    return !!eng.likes[cardId];
  },

  isFavorited: function (cardId) {
    var eng = this.globalData.engagements;
    if (!eng || !eng.favorites) return false;
    if (Array.isArray(eng.favorites)) {
      return eng.favorites.some(function (item) {
        return typeof item === 'string' ? item === cardId : item.cardId === cardId;
      });
    }
    return !!eng.favorites[cardId];
  },
});
