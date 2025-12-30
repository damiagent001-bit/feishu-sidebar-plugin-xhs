/**
 * 插件配置
 */

/**
 * 服务端 API 配置
 */
export const API_CONFIG = {
  // 服务端 API 地址（完整 URL）
  // 本地开发
  // BASE_URL: 'http://127.0.0.1:8009',
  // 生产环境
  BASE_URL: 'https://feishu-plugin.esecretary.cn',
};

/**
 * API 端点（根据平台动态构建）
 */
export const API_ENDPOINTS = {
  // 根据飞书用户ID获取用户信息接口
  getUserInfo: () => `/api/v1/user/info`,
  // 主页批量获取接口（需要传入平台参数）
  getHomepageBatch: (platform) => `/api/v1/sidebar/vda/${platform}/homepage-batch`,
  // 关键词搜索获取接口（需要传入平台参数）
  getKeywordSearch: (platform) => `/api/v1/sidebar/vda/${platform}/keyword-search`,
  // 获取套餐列表接口（需要传入服务编码）
  getPricingPlans: (serviceCode) => `/api/v1/pricing/service/${serviceCode}/plans`,
  // 创建订单接口
  createOrder: () => `/api/v1/payment/create-order`,
  // 查询订单状态接口
  queryOrder: (orderId) => `/api/v1/payment/query-order/${orderId}`,
  // 轮询订单状态接口
  pollOrder: (orderId) => `/api/v1/payment/poll-order/${orderId}`,
};

/**
 * 根据平台获取服务编码
 */
export const getServiceCodeByPlatform = (platform) => {
  return platform === 'xiaohongshu' ? 'sidebar_xiaohongshu' : 'sidebar_douyin';
};

/**
 * 平台选项（小红书专用版本，只保留小红书）
 */
export const PLATFORM_OPTIONS = [
  { label: '小红书', value: 'xiaohongshu' },
];

/**
 * 数据范围选项
 */
export const EXTRACT_RANGE_OPTIONS = [
  { label: '仅获取首页', value: 'homepage_only' },
  { label: '获取前5页', value: 'first_5_pages' },
  { label: '获取前10页', value: 'first_10_pages' },
  { label: '获取前20页', value: 'first_20_pages' },
  { label: '获取前30页', value: 'first_30_pages' },
  { label: '获取前50页', value: 'first_50_pages' },
  { label: '全量获取', value: 'all' },
];

/**
 * 排序方式选项
 */
export const SORT_TYPE_OPTIONS = [
  { label: '综合', value: 'comprehensive' },
  { label: '最多点赞', value: 'most_likes' },
  { label: '最新发布', value: 'latest' },
];

/**
 * 发布时间选项
 */
export const PUBLISH_TIME_OPTIONS = [
  { label: '不限', value: 'unlimited' },
  { label: '一天之内', value: 'within_1_day' },
  { label: '一周之内', value: 'within_1_week' },
  { label: '半年之内', value: 'within_half_year' },
];

/**
 * 筛选时长选项
 */
export const DURATION_FILTER_OPTIONS = [
  { label: '不限', value: 'unlimited' },
  { label: '1分钟以下', value: 'under_1_min' },
  { label: '1-5分钟', value: '1_to_5_min' },
  { label: '5分钟以上', value: 'over_5_min' },
];

/**
 * 字段选项（严格顺序）
 * 抖音平台字段
 */
export const FIELD_OPTIONS_DOUYIN = [
  { key: 'item_id', label: '作品ID', required: true },
  { key: 'video_play_url', label: '视频播放URL', required: false },
  { key: 'item_desc', label: '作品描述', required: false },
  { key: 'video_cover_url', label: '视频封面URL', required: false },
  { key: 'video_large_thumbnail', label: '视频大缩略图', required: false },
  { key: 'digg_count', label: '点赞数', required: false },
  { key: 'collect_count', label: '收藏数', required: false },
  { key: 'share_count', label: '转发数', required: false },
  { key: 'comment_count', label: '评论数', required: false },
  { key: 'play_count', label: '播放数', required: false },
  { key: 'goods_data', label: '带货商品数据', required: false },
  { key: 'create_time', label: '作品创建时间', required: false },
  { key: 'author_id', label: '作者ID', required: false },
  { key: 'author_nickname', label: '作者昵称', required: false },
  { key: 'follower_count', label: '粉丝数', required: false },
  { key: 'video_duration', label: '视频时长', required: false },
  { key: 'music_title', label: '音乐标题', required: false },
  { key: 'music_author', label: '音乐作者', required: false },
  { key: 'author_uid', label: '作者UID', required: false },
  { key: 'author_signature', label: '作者签名', required: false },
  { key: 'narration_audio_url', label: '视频解说音频', required: false },
];

/**
 * 小红书平台字段（严格按照指定顺序）
 */
export const FIELD_OPTIONS_XIAOHONGSHU = [
  { key: 'note_title', label: '笔记标题', required: true },
  { key: 'note_content', label: '笔记正文', required: false },
  { key: 'item_id', label: '作品ID', required: false },
  { key: 'item_desc', label: '作品描述', required: false },
  { key: 'video_play_url', label: '视频播放URL', required: false },
  { key: 'video_cover_url', label: '视频封面URL', required: false },
  { key: 'video_large_thumbnail', label: '视频大缩略图', required: false },
  { key: 'digg_count', label: '点赞数', required: false },
  { key: 'collect_count', label: '收藏数', required: false },
  { key: 'share_count', label: '转发数', required: false },
  { key: 'comment_count', label: '评论数', required: false },
  { key: 'goods_data', label: '带货商品数据', required: false },
  { key: 'create_time', label: '作品创建时间', required: false },
  { key: 'author_id', label: '作者ID', required: false },
  { key: 'author_nickname', label: '作者昵称', required: false },
  { key: 'follower_count', label: '粉丝数', required: false },
  { key: 'video_duration', label: '视频时长', required: false },
  { key: 'music_title', label: '音乐标题', required: false },
  { key: 'music_author', label: '音乐作者', required: false },
  { key: 'author_signature', label: '作者签名', required: false },
  { key: 'narration_audio_url', label: '视频解说音频', required: false },
];

/**
 * 根据平台获取字段选项
 */
export const getFieldOptions = (platform) => {
  if (platform === 'xiaohongshu') {
    return FIELD_OPTIONS_XIAOHONGSHU;
  }
  return FIELD_OPTIONS_DOUYIN;
};

/**
 * 兼容旧代码：默认使用抖音字段
 */
export const FIELD_OPTIONS = FIELD_OPTIONS_DOUYIN;

/**
 * 外部链接配置
 */
export const EXTERNAL_LINKS = {
  // 用户群链接
  USER_GROUP: 'https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=584offb8-211d-4f05-87ac-3f3f5a334a21',
};

/**
 * 样式主题配置（根据平台切换）
 * 抖音风格：深灰黑基调 + 粉紫湖蓝渐变
 * 小红书风格：白色基调 + 活力橘红 + 清新蓝绿
 */
export const STYLE_THEMES = {
  douyin: {
    // 主背景色
    '--style-bg-primary': '#121212',      // 深灰黑
    '--style-bg-content': '#1E1E1E',      // 中灰黑（卡片、内容区）
    
    // 强调色
    '--style-color-accent': '#FF66CC',     // 粉紫渐变（按钮、标签、交互反馈）
    '--style-color-secondary': '#00FFFF',  // 湖蓝（次要操作、进度条）
    
    // 文本色
    '--style-text-primary': '#FFFFFF',     // 主要文字（白色，高对比度）
    '--style-text-secondary': '#CCCCCC',   // 辅助信息、时间戳（亮灰，提高对比度）
    '--style-text-placeholder': '#888888', // 占位符文本
    
    // 边框和分割线
    '--style-border': '#333333',
    
    // 渐变（用于背景、按钮等）
    '--style-gradient-main': 'linear-gradient(135deg, #FF66CC 0%, #00FFFF 100%)',
    
    // 卡片阴影
    '--style-card-shadow': '0 4px 12px rgba(0, 0, 0, 0.3)',
    
    // 交互效果
    '--style-hover-bg': 'rgba(255, 102, 204, 0.1)',
    '--style-active-bg': 'rgba(255, 102, 204, 0.2)',
  },
  xiaohongshu: {
    // 主背景色
    '--style-bg-primary': '#FFFFFF',      // 全局界面底色（纯白）
    '--style-bg-content': '#F8F8F8',      // 内容区底色（卡片、笔记区域，弱化纯白单调）
    
    // 强调色
    '--style-color-accent': '#FF2442',     // 主强调色（Logo、导航选中态、按钮主色，火红色）
    '--style-color-secondary': '#FFE6EA',  // 次要强调（标签背景、输入框聚焦边框，主色浅淡版）
    '--style-color-assistant': '#3399FF',  // 辅助色（私信、评论区等）
    '--style-color-highlight': '#FFD700',  // 高亮色（收藏按钮填充色）
    
    // 文本色
    '--style-text-primary': '#333333',     // 文本主色（笔记标题、正文内容）
    '--style-text-secondary': '#666666',   // 文本次要（辅助信息、作者简介）
    '--style-text-placeholder': '#999999', // 占位符文本（时间等辅助信息）
    
    // 边框和分割线
    '--style-border': '#EEEEEE',           // 边框/分割线（卡片边框、区域分割线）
    
    // 渐变（用于背景、按钮等）
    '--style-gradient-main': 'linear-gradient(135deg, #FF2442 0%, #FF6B8A 100%)',
    
    // 卡片阴影
    '--style-card-shadow': '0 2px 8px rgba(0, 0, 0, 0.08)',
    
    // 交互效果
    '--style-hover-bg': 'rgba(255, 36, 66, 0.08)',  // 悬停背景（主色浅淡版）
    '--style-active-bg': 'rgba(255, 36, 66, 0.15)', // 激活背景
  },
};

