var api = require('../../utils/api');
var util = require('../../utils/util');

Page({
  data: {
    cards: [],
    filteredCards: [],
    loading: true,
    activeTab: 'all',
    filterCity: '',
    cities: [],
  },

  _loaded: false,

  onLoad: function () {
    this.loadCards();
  },

  onShow: function () {
    if (this._loaded) {
      this.refreshEngagements();
    }
  },

  onPullDownRefresh: function () {
    var that = this;
    this.loadCards().then(function () {
      wx.stopPullDownRefresh();
    }).catch(function () {
      wx.stopPullDownRefresh();
    });
  },

  loadCards: function () {
    var that = this;
    this.setData({ loading: true });
    return api
      .fetchCards('expert')
      .then(function (res) {
        var app = getApp();
        var list = [];
        if (res && Array.isArray(res.items)) {
          list = res.items;
        } else if (Array.isArray(res)) {
          list = res;
        }
        var cards = list.map(function (c) {
          return Object.assign({}, c, {
            publishedAtText: util.formatTime(c.publishedAt || c.createdAt),
            isLiked: app.isLiked(c.id),
            isFavorited: app.isFavorited(c.id),
            strengths: c.strengths || [],
          });
        });
        var citySet = {};
        cards.forEach(function (c) {
          if (c.city) citySet[c.city] = true;
        });
        that.setData({
          cards: cards,
          cities: Object.keys(citySet),
          loading: false,
        });
        that._loaded = true;
        that.applyFilter();
      })
      .catch(function (err) {
        console.error('projects loadCards error:', err);
        that.setData({ loading: false, filteredCards: [] });
        that._loaded = true;
      });
  },

  refreshEngagements: function () {
    var app = getApp();
    if (!api.getToken()) return;
    if (this.data.cards.length === 0) return;
    app.loadEngagements();
    var that = this;
    setTimeout(function () {
      var cards = that.data.cards.map(function (c) {
        return Object.assign({}, c, {
          isLiked: app.isLiked(c.id),
          isFavorited: app.isFavorited(c.id),
        });
      });
      that.setData({ cards: cards });
      that.applyFilter();
    }, 600);
  },

  switchTab: function (e) {
    var tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    this.applyFilter();
  },

  setCity: function (e) {
    var city = e.currentTarget.dataset.city;
    this.setData({ filterCity: city === this.data.filterCity ? '' : city });
    this.applyFilter();
  },

  clearFilter: function () {
    this.setData({ filterCity: '' });
    this.applyFilter();
  },

  applyFilter: function () {
    var tab = this.data.activeTab;
    var city = this.data.filterCity;
    var app = getApp();
    var profile = app.globalData.userInfo;
    var cards = this.data.cards.slice();

    if (tab === 'created') {
      cards = cards.filter(function (c) {
        return profile && profile.card && c.id === profile.card.id;
      });
    } else if (tab === 'favorited') {
      cards = cards.filter(function (c) {
        return c.isFavorited;
      });
    }

    if (city) {
      cards = cards.filter(function (c) {
        return c.city === city;
      });
    }

    this.setData({ filteredCards: cards });
  },

  toggleLike: function (e) {
    if (!util.requireLogin()) return;
    var id = e.currentTarget.dataset.id;
    var idx = parseInt(e.currentTarget.dataset.index, 10);
    var key = 'filteredCards[' + idx + '].isLiked';
    var card = this.data.filteredCards[idx];
    if (!card) return;
    var active = !card.isLiked;
    this.setData({ [key]: active });
    api.toggleEngagement(id, 'like', active).catch(function () {});
  },

  toggleFavorite: function (e) {
    if (!util.requireLogin()) return;
    var id = e.currentTarget.dataset.id;
    var idx = parseInt(e.currentTarget.dataset.index, 10);
    var key = 'filteredCards[' + idx + '].isFavorited';
    var card = this.data.filteredCards[idx];
    if (!card) return;
    var active = !card.isFavorited;
    this.setData({ [key]: active });
    api.toggleEngagement(id, 'favorite', active).catch(function () {});
  },

  goDetail: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/card-detail/index?id=' + id });
  },

  goPublish: function () {
    if (!util.requireLogin()) return;
    wx.navigateTo({ url: '/pages/publish/index?role=expert' });
  },
});
