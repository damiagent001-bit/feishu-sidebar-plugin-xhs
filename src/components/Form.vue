<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick, inject } from 'vue';
import { useI18n } from 'vue-i18n';
  import { bitable } from '@lark-base-open/js-sdk';
import { ElMessage } from 'element-plus';
import MembershipPlan from './MembershipPlan.vue';

// 注入样式主题切换函数
const setStyleTheme = inject('setStyleTheme', null);

// Element Plus 消息提示封装
const showSuccessToast = (message) => {
  ElMessage.success(message);
};

const showFailToast = (message) => {
  ElMessage.error(message);
};

const showToast = (message) => {
  ElMessage.info(message);
};
  import {
  API_CONFIG, 
  API_ENDPOINTS,
  PLATFORM_OPTIONS,
  EXTRACT_RANGE_OPTIONS,
  SORT_TYPE_OPTIONS,
  PUBLISH_TIME_OPTIONS,
  DURATION_FILTER_OPTIONS,
  getFieldOptions,
  getServiceCodeByPlatform,
  EXTERNAL_LINKS,
} from '../config.js';

const { t } = useI18n();

// localStorage Key 常量
const API_KEY_STORAGE_NAME = 'feishu_plugin_api_key';
const REMEMBER_API_KEY_STORAGE_NAME = 'feishu_plugin_remember_api_key';

// 保存 API Key 到 localStorage
const saveApiKeyToStorage = (value) => {
  try {
    if (value && value.trim()) {
      localStorage.setItem(API_KEY_STORAGE_NAME, value.trim());
      localStorage.setItem(REMEMBER_API_KEY_STORAGE_NAME, 'true');
    } else {
      localStorage.removeItem(API_KEY_STORAGE_NAME);
      localStorage.removeItem(REMEMBER_API_KEY_STORAGE_NAME);
    }
  } catch (e) {
    console.error('Failed to save API Key to localStorage:', e);
  }
};

// 从 localStorage 读取 API Key
const loadApiKeyFromStorage = () => {
  try {
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_NAME);
    const rememberStatus = localStorage.getItem(REMEMBER_API_KEY_STORAGE_NAME);
    if (savedApiKey && rememberStatus === 'true') {
      return savedApiKey;
    }
    return null;
  } catch (e) {
    console.error('Failed to load API Key from localStorage:', e);
    return null;
  }
};

// 删除 localStorage 中的 API Key
const removeApiKeyFromStorage = () => {
  try {
    localStorage.removeItem(API_KEY_STORAGE_NAME);
    localStorage.removeItem(REMEMBER_API_KEY_STORAGE_NAME);
  } catch (e) {
    console.error('Failed to remove API Key from localStorage:', e);
  }
};

// 套餐页面显示状态
const showMembershipPlan = ref(false);
// 当前会员类型（从后端获取或本地存储）
const currentPlan = ref('free'); // 'free', 'member', 'super'

// 当前标签页
const activeTab = ref('0');

// API Key
const apiKey = ref('');

// 记住登录状态（localStorage）
const rememberApiKey = ref(false);

// 表格选择
const tableOption = ref('create'); // 'create' 或 'existing'
const selectedTableId = ref('');
      const tableMetaList = ref([]);

// 根据平台获取字段选项（响应式）
const getCurrentFieldOptions = computed(() => {
  const platform = activeTab.value === '0' 
    ? homepageFormData.platform 
    : keywordFormData.platform;
  return getFieldOptions(platform);
});

// 获取默认选中字段（根据平台）
const getDefaultSelectedFields = (platform) => {
  return getFieldOptions(platform).map(field => field.key);
};

// 默认选中所有字段（根据当前平台）- 用于响应式更新
const defaultSelectedFields = computed(() => {
  return getCurrentFieldOptions.value.map(field => field.key);
});

// 表单数据 - 主页批量获取
const homepageFormData = reactive({
  platform: 'xiaohongshu', // 小红书专用版本，默认平台为小红书
  homepageEntries: [''], // 支持主页链接或博主ID，统一字符串形式
  sortType: 'comprehensive',
  publishTime: 'unlimited',
  durationFilter: 'unlimited',
  extractRange: 'homepage_only',
  selectedFields: getDefaultSelectedFields('xiaohongshu'), // 默认选中所有字段
});

// 表单数据 - 关键词搜索获取
const keywordFormData = reactive({
  platform: 'xiaohongshu', // 小红书专用版本，默认平台为小红书
  keyword: '',
  sortType: 'comprehensive',
  publishTime: 'unlimited',
  durationFilter: 'unlimited',
  extractRange: 'homepage_only',
  selectedFields: getDefaultSelectedFields('xiaohongshu'), // 默认选中所有字段
});

// 会员信息卡片
const membershipInfo = reactive({
  plan: '免费版',
  totalRemainingPoints: 0, // 总剩余智能点数（累加值）
  validPeriodStart: null, // 有效期开始日期
  validPeriodEnd: null, // 有效期结束日期
  desc: '获取1条数据扣除1智能点，点击下方购买会员获取更多智能点',
});

// 折叠面板状态
const advancedSettingsCollapse = ref([]);
const fieldsCollapse = ref([]);

// 加载状态
const loading = ref(false);

// 飞书用户ID
const feishuUserId = ref('');


// 获取表格列表
const loadTables = async () => {
  try {
    const tableList = await bitable.base.getTableMetaList();
    tableMetaList.value = tableList.map(meta => ({
      text: meta.name,
      value: meta.id
    }));
    
    // 如果有选中的表格，设置为默认值
    try {
      const selection = await bitable.base.getSelection();
      if (selection.tableId) {
        selectedTableId.value = selection.tableId;
      }
    } catch (e) {
      // 忽略选择错误
    }
  } catch (error) {
    console.error('Failed to load tables:', error);
    showFailToast(t('error'));
  }
};

// 添加链接
const addHomepageEntry = () => {
  homepageFormData.homepageEntries.push('');
};

// 删除链接
const removeHomepageEntry = (index) => {
  if (homepageFormData.homepageEntries.length > 1) {
    homepageFormData.homepageEntries.splice(index, 1);
  } else {
    homepageFormData.homepageEntries[0] = '';
  }
};

// 打开用户群链接
const openUserGroup = () => {
  window.open(EXTERNAL_LINKS.USER_GROUP, '_blank');
};

// 打开套餐选择页面
const openMembershipPlan = () => {
  showMembershipPlan.value = true;
};

// 关闭套餐选择页面
const closeMembershipPlan = () => {
  showMembershipPlan.value = false;
};

// 获取 API Key
const getApiKey = async () => {
  try {
    // 获取飞书用户ID
    const feishuUserId = await bitable.bridge.getBaseUserId();
    
    if (!feishuUserId) {
      showFailToast('无法获取飞书用户ID');
      return;
    }
    
    showToast('正在获取绑定链接...');
    
    // 调用后端接口获取绑定链接
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/user/api-key/bind-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feishu_user_id: feishuUserId,
      }),
    });
    
    const result = await response.json();
    
    if (result.code === 0 && result.data && result.data.bind_url) {
      // 打开新窗口跳转到API Key管理平台
      // 使用 setTimeout 避免在事件处理中直接打开窗口（可能被浏览器阻止）
      setTimeout(() => {
        window.open(result.data.bind_url, '_blank');
      }, 100);
      showSuccessToast('正在跳转到API Key管理平台...');
    } else {
      showFailToast(result.msg || '获取绑定链接失败');
    }
  } catch (error) {
    console.error('Failed to get API Key:', error);
    showFailToast('获取 API Key 失败: ' + error.message);
  }
};

// 处理购买
const handlePurchase = async (order) => {
  if (!order) {
    return;
  }
  
  // 关闭套餐选择页面
  closeMembershipPlan();
  
  // 等待后端处理完成（支付成功处理需要创建订阅和智能点）
  // 给后端一些时间完成处理
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 刷新用户信息（更新智能点余额）
  await getUserInfo();
  
  showSuccessToast('支付成功！会员信息已更新');
};

// 创建表格
const createTable = async (fieldKeys, platform = 'douyin') => {
  try {
    const base = bitable.base;
    
    // 根据平台生成前缀
    const platformPrefix = platform === 'xiaohongshu' ? '小红书' : '抖音';
    
    // 生成安全的表格名称：平台视频数据_MMDD_HHmmss（添加秒数避免重复）
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    const tableName = `${platformPrefix}视频数据_${month}${day}_${hour}${minute}${second}`;
    
    // 创建表格
    const { tableId } = await base.addTable({
      name: tableName,
    });
    
    // 获取表格对象
    const table = await base.getTableById(tableId);
    
    // 获取表格的默认字段列表（第一列是默认存在的）
    const defaultFields = await table.getFieldMetaList();
    const defaultField = defaultFields[0]; // 第一列是默认字段
    
    const fieldMap = {};
    
    // 根据平台确定主键字段
    const primaryKey = platform === 'xiaohongshu' ? 'note_title' : 'item_id';
    const primaryKeyLabel = platform === 'xiaohongshu' ? '笔记标题' : '作品ID';
    
    // 处理主键：使用默认的第一列，修改名称为对应的标签
    if (fieldKeys.includes(primaryKey)) {
      if (defaultField) {
        // 修改默认字段的名称为对应的标签
        await table.setField(defaultField.id, { name: primaryKeyLabel });
        fieldMap[primaryKey] = defaultField.id;
        console.log(`Using default field for ${primaryKey}, renamed to "${primaryKeyLabel}":`, defaultField.id);
      }
    }
    
    // 创建其他字段（排除主键）
    const sortedFieldKeys = fieldKeys.filter(key => key !== primaryKey);
    const fieldOptions = getFieldOptions(platform);
    
    for (const fieldKey of sortedFieldKeys) {
      const fieldOption = fieldOptions.find(f => f.key === fieldKey);
      if (!fieldOption) continue;
      
      let fieldType;
      let fieldName = fieldOption.label;
      
      // 根据字段类型设置
      if (fieldKey === 'blogger_id' || fieldKey === 'link') {
        fieldType = 1; // 文本
      } else if (fieldKey === 'publish_time' || fieldKey === 'update_time') {
        fieldType = 5; // 日期时间
      } else if (fieldKey.includes('count') || fieldKey === 'likes_count' || fieldKey === 'comments_count' || 
                 fieldKey === 'shares_count' || fieldKey === 'favorites_count' || fieldKey === 'danmaku_count' ||
                 fieldKey === 'new_likes_count' || fieldKey === 'new_comments_count') {
        fieldType = 2; // 数字
      } else if (fieldKey === 'cover_image') {
        fieldType = 17; // 附件
      } else {
        fieldType = 1; // 默认文本
      }
      
      const fieldId = await table.addField({
        type: fieldType,
        name: fieldName,
      });
      
      // addField 直接返回字段 ID 字符串
      fieldMap[fieldKey] = fieldId;
      console.log(`Created field ${fieldName} (${fieldKey}):`, fieldId);
    }
    
    console.log('Field map after creation:', fieldMap);
    console.log('Table created successfully, tableId:', tableId, 'table.id:', table.id);
    return { table, fieldMap, tableName, tableId };
  } catch (error) {
    console.error('Failed to create table:', error);
    showFailToast(t('createTableFailed') + ': ' + error.message);
    throw error;
  }
};

// 获取或创建字段
const getOrCreateFields = async (table, fieldKeys, platform) => {
  const fieldMap = {};
  const fieldOptions = getFieldOptions(platform);
  
  try {
    // 获取所有字段
    const fieldList = await table.getFieldMetaList();
    const existingFieldMap = {};
    const defaultField = fieldList[0]; // 第一列是默认字段
    
    // 处理 item_id 或 note_title：优先使用第一列（默认字段）
    const primaryKey = platform === 'xiaohongshu' ? 'note_title' : 'item_id';
    const primaryKeyLabel = platform === 'xiaohongshu' ? '笔记标题' : '作品ID';
    
    if (fieldKeys.includes(primaryKey)) {
      if (defaultField) {
        // 如果第一列的名称不是期望的名称，修改它
        if (defaultField.name !== primaryKeyLabel) {
          await table.setField(defaultField.id, { name: primaryKeyLabel });
          console.log(`Renamed default field to "${primaryKeyLabel}":`, defaultField.id);
        }
        fieldMap[primaryKey] = defaultField.id;
        console.log(`Using default field for ${primaryKey}:`, defaultField.id);
      }
    }
    
    // 匹配其他已存在的字段
    for (const field of fieldList) {
      // 跳过第一列（已经用于主键）
      if (field.id === defaultField?.id) continue;
      
      // 通过字段名匹配
      const fieldOption = fieldOptions.find(f => f.label === field.name);
      if (fieldOption && fieldKeys.includes(fieldOption.key)) {
        existingFieldMap[fieldOption.key] = field.id;
      }
    }
    
    // 创建缺失的字段（排除主键，因为它已经使用第一列）
    const fieldsToCreate = fieldKeys.filter(key => key !== primaryKey);
    
    for (const fieldKey of fieldsToCreate) {
      if (existingFieldMap[fieldKey]) {
        fieldMap[fieldKey] = existingFieldMap[fieldKey];
        continue;
      }
      
      const fieldOption = fieldOptions.find(f => f.key === fieldKey);
      if (!fieldOption) continue;
      
      let fieldType;
      const fieldName = fieldOption.label;
      
      if (fieldKey === 'blogger_id' || fieldKey === 'link') {
        fieldType = 1; // 文本
      } else if (fieldKey === 'publish_time' || fieldKey === 'update_time') {
        fieldType = 5; // 日期时间
      } else if (fieldKey.includes('count') || fieldKey === 'likes_count' || fieldKey === 'comments_count' || 
                 fieldKey === 'shares_count' || fieldKey === 'favorites_count' || fieldKey === 'danmaku_count' ||
                 fieldKey === 'new_likes_count' || fieldKey === 'new_comments_count') {
        fieldType = 2; // 数字
      } else if (fieldKey === 'cover_image') {
        fieldType = 17; // 附件
      } else {
        fieldType = 1; // 默认文本
      }
      
      const fieldId = await table.addField({
        type: fieldType,
        name: fieldName,
      });
      
      // addField 直接返回字段 ID 字符串
      fieldMap[fieldKey] = fieldId;
    }
    
    return fieldMap;
  } catch (error) {
    console.error('Failed to get or create fields:', error);
    throw error;
  }
};

// 写入数据到表格
const writeDataToTable = async (videos, fieldKeys, platform = 'douyin') => {
  try {
    let table;
    let fieldMap;
    
    let createdTableName = null;
    let createdTableId = null;
    if (tableOption.value === 'create') {
      // 创建新表格
      const result = await createTable(fieldKeys, platform);
      createdTableId = result.tableId || result.table.id;
      createdTableName = result.tableName;
      fieldMap = result.fieldMap;
      
      // 重新获取表格对象，确保可以正常使用
      console.log('Created table ID:', createdTableId);
      console.log('Original table object:', result.table);
      
      // 使用 tableId 重新获取表格对象，确保是最新的
      table = await bitable.base.getTableById(createdTableId);
      console.log('Retrieved table object:', table);
      console.log('Table ID from retrieved object:', table.id);
      console.log('Field map after table creation:', fieldMap);
    } else {
      // 使用现有表格
      if (!selectedTableId.value) {
        showFailToast(t('selectTableRequired'));
        return;
      }
      table = await bitable.base.getTableById(selectedTableId.value);
      fieldMap = await getOrCreateFields(table, fieldKeys, platform);
    }
    
    console.log('Table object before writing:', table);
    console.log('Field map:', fieldMap);
    
    // 根据平台确定主键字段
    const primaryKey = platform === 'xiaohongshu' ? 'note_title' : 'item_id';
    console.log(`${primaryKey} fieldId in fieldMap:`, fieldMap[primaryKey]);
    console.log('fieldKeys:', fieldKeys);
    console.log(`${primaryKey} in fieldKeys:`, fieldKeys.includes(primaryKey));
    
    // 批量写入数据
    const records = [];
    let skippedCount = 0;
    let skippedReasons = [];
    
    console.log(`开始处理 ${videos.length} 条数据，主键字段: ${primaryKey}`);
    
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const fields = {};
      let hasPrimaryKey = false;
      
      // 先检查主键字段是否存在且有效
      const primaryValue = video[primaryKey];
      if (primaryValue === null || primaryValue === undefined || primaryValue === '') {
        skippedCount++;
        skippedReasons.push(`记录 ${i + 1}: 主键字段 ${primaryKey} 为空`);
        console.warn(`跳过记录 ${i + 1}: 主键字段 ${primaryKey} 为空`, video);
        continue; // 跳过这条记录
      }
      
      for (const fieldKey of fieldKeys) {
        const fieldId = fieldMap[fieldKey];
        if (!fieldId) {
          console.warn(`记录 ${i + 1}: Field ID not found for key: ${fieldKey}`);
          continue;
        }
        
        let value = video[fieldKey];
        
        // 处理不同类型的值
        if (fieldKey === 'publish_time' || fieldKey === 'update_time') {
          // 日期时间字段 - bitable 需要时间戳（毫秒）
          if (value !== null && value !== undefined && value !== '') {
            const timestamp = Number(value);
            if (!isNaN(timestamp) && timestamp > 0) {
              fields[fieldId] = timestamp;
            }
          }
        } else if (fieldKey === 'cover_image') {
          // 附件字段 - bitable 附件格式
          // 注意：附件字段需要先上传文件获取 token，或使用有效的 URL
          if (value && value !== null && value !== undefined && value !== '') {
            // 对于 URL 类型的附件，直接使用 URL
            // 如果 URL 无效，可能需要先上传文件
            try {
              const url = String(value).trim();
              if (url && url.startsWith('http')) {
                fields[fieldId] = [{ type: 'url', url: url, name: url.split('/').pop() || 'cover.jpg' }];
              }
            } catch (e) {
              console.warn(`记录 ${i + 1}: Failed to set cover_image:`, e);
              // 如果附件设置失败，跳过该字段
            }
          }
        } else if (fieldKey.includes('count') || fieldKey === 'likes_count' || fieldKey === 'comments_count' || 
                   fieldKey === 'shares_count' || fieldKey === 'favorites_count' || fieldKey === 'danmaku_count' ||
                   fieldKey === 'new_likes_count' || fieldKey === 'new_comments_count') {
          // 数字字段
          if (value !== null && value !== undefined && value !== '') {
            const numValue = Number(value);
            if (!isNaN(numValue)) {
              fields[fieldId] = numValue;
            }
          }
        } else {
          // 文本字段（包括主键字段）
          if (value !== null && value !== undefined && value !== '') {
            const stringValue = String(value);
            fields[fieldId] = stringValue;
            if (fieldKey === primaryKey) {
              hasPrimaryKey = true;
              console.log(`记录 ${i + 1}: Set ${primaryKey} field: fieldId=${fieldId}, value=${stringValue}`);
            }
          }
        }
      }
      
      // 验证主键字段是否已设置
      if (!hasPrimaryKey || !fields[fieldMap[primaryKey]]) {
        skippedCount++;
        skippedReasons.push(`记录 ${i + 1}: 主键字段 ${primaryKey} 未设置到 fields 中`);
        console.warn(`跳过记录 ${i + 1}: 主键字段 ${primaryKey} 未设置到 fields 中`, {
          video,
          fields,
          hasPrimaryKey,
          primaryKeyFieldId: fieldMap[primaryKey]
        });
        continue;
      }
      
      // 只有当 fields 不为空且包含主键字段时才添加记录
      if (Object.keys(fields).length > 0) {
        records.push({ fields });
      } else {
        skippedCount++;
        skippedReasons.push(`记录 ${i + 1}: fields 为空`);
        console.warn(`跳过记录 ${i + 1}: fields 为空`, video);
      }
    }
    
    console.log(`数据处理完成: 总数据 ${videos.length} 条，准备写入 ${records.length} 条，跳过 ${skippedCount} 条`);
    if (skippedCount > 0) {
      console.warn('跳过的记录原因:', skippedReasons);
    }
    console.log('First record sample:', JSON.stringify(records[0], null, 2));
    console.log('Field map:', fieldMap);
    
    // 验证第一条记录的数据
    if (records.length > 0) {
      const firstRecord = records[0];
      console.log('First record fields count:', Object.keys(firstRecord.fields || {}).length);
      console.log('First record field IDs:', Object.keys(firstRecord.fields || {}));
      
      // 检查每个字段的值
      for (const [fieldId, fieldValue] of Object.entries(firstRecord.fields || {})) {
        const fieldKey = Object.keys(fieldMap).find(key => fieldMap[key] === fieldId);
        console.log(`Field ${fieldKey} (${fieldId}):`, typeof fieldValue, fieldValue);
      }
    }
    
    // 批量添加记录
    if (records.length > 0) {
      try {
        console.log(`准备写入 ${records.length} 条记录到表格`);
        const recordIds = await table.addRecords(records);
        console.log('Added records, IDs:', recordIds);
        console.log(`成功写入 ${recordIds.length} 条记录（预期 ${records.length} 条）`);
        
        // 如果写入的记录数少于预期，记录警告
        if (recordIds.length < records.length) {
          console.warn(`警告: 预期写入 ${records.length} 条记录，实际只写入了 ${recordIds.length} 条`);
        }
        
        // 如果写入的记录数少于后端返回的数据数，记录警告
        if (recordIds.length < videos.length) {
          console.warn(`警告: 后端返回 ${videos.length} 条数据，实际只写入了 ${recordIds.length} 条，差异 ${videos.length - recordIds.length} 条`);
        }
        
        // 显示成功提示（只显示一次）
        let successMessage = `成功写入 ${recordIds.length} 条数据！`;
        if (recordIds.length < videos.length) {
          successMessage += `（后端返回 ${videos.length} 条，${videos.length - recordIds.length} 条未写入）`;
        }
        
        // 如果是新建表格，检查是否需要提示切换表格
        if (tableOption.value === 'create' && createdTableName) {
          try {
            const selection = await bitable.base.getSelection();
            console.log('Current selection:', selection);
            
            // 如果当前选中的不是我们刚创建的表格，提示用户切换
            if (createdTableId && selection.tableId !== createdTableId) {
              console.log('Table created but not selected. Current table:', selection.tableId, 'Created table:', createdTableId);
              successMessage += `请切换到表格"${createdTableName}"查看数据。`;
            } else {
              successMessage += `数据已保存到表格中。`;
            }
          } catch (refreshError) {
            console.warn('Could not check table selection:', refreshError);
            successMessage += `数据已保存到表格中。`;
          }
        } else {
          successMessage += `数据已保存到表格中。`;
        }
        
        showSuccessToast(successMessage);
      } catch (addError) {
        console.error('addRecords error:', addError);
        throw addError;
      }
    } else {
      console.warn('No records to add');
      showFailToast('没有数据可写入');
    }
  } catch (error) {
    console.error('Failed to write data:', error);
    showFailToast(t('writeDataFailed') + ': ' + error.message);
    throw error;
  }
};

// 提交主页批量获取
const handleHomepageSubmit = async () => {
  // 验证链接
  const validEntries = homepageFormData.homepageEntries
    .map(item => item.trim())
    .filter(item => item);
  
  if (validEntries.length === 0) {
    showFailToast(t('homepageUrlRequired'));
    return;
  }
  
  // 验证字段选择（根据平台检查主键字段）
  const primaryKey = homepageFormData.platform === 'xiaohongshu' ? 'note_title' : 'item_id';
  if (!homepageFormData.selectedFields.includes(primaryKey)) {
    showFailToast(t('fieldRequired'));
    return;
  }
  
  // 验证表格选择
  if (tableOption.value === 'existing' && !selectedTableId.value) {
    showFailToast(t('selectTableRequired'));
    return;
  }
  
  loading.value = true;
  
  try {
    // 调用后端接口（根据平台动态构建接口路径）
    const endpoint = API_ENDPOINTS.getHomepageBatch(homepageFormData.platform);
    
    // ✨ 构建请求头，如果提供了 API Key 则添加，否则使用飞书用户ID
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // 如果提供了 API Key，添加 X-API-Key header
    if (apiKey.value && apiKey.value.trim()) {
      headers['X-API-Key'] = apiKey.value.trim();
    } else if (feishuUserId.value) {
      // 如果没有 API Key，使用原有的 X-Feishu-User-ID header
      headers['X-Feishu-User-ID'] = feishuUserId.value;
    }
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        platform: homepageFormData.platform,
        inputs: validEntries,
        sort_type: homepageFormData.sortType,
        publish_time: homepageFormData.publishTime,
        duration_filter: homepageFormData.durationFilter,
        extract_range: homepageFormData.extractRange,
        selected_fields: homepageFormData.selectedFields,
      }),
    });
    
    const result = await response.json();
    
    console.log('API Response:', result);
    
    if (result.code === 0 && result.data && result.data.videos) {
      console.log('Videos count:', result.data.videos.length);
      console.log('Selected fields:', homepageFormData.selectedFields);
      // 写入数据到表格
      await writeDataToTable(result.data.videos, homepageFormData.selectedFields, homepageFormData.platform);
      
      // 刷新用户信息（更新智能点余额）
      await getUserInfo();
    } else {
      showFailToast(result.msg || t('error'));
    }
  } catch (error) {
    console.error('Submit error:', error);
    showFailToast(t('error') + ': ' + error.message);
  } finally {
    loading.value = false;
  }
};

// 提交关键词搜索获取
const handleKeywordSubmit = async () => {
  // 验证关键词
  if (!keywordFormData.keyword || !keywordFormData.keyword.trim()) {
    showFailToast(t('keywordRequired'));
    return;
  }
  
  // 验证字段选择（根据平台检查主键字段）
  const primaryKey = keywordFormData.platform === 'xiaohongshu' ? 'note_title' : 'item_id';
  if (!keywordFormData.selectedFields.includes(primaryKey)) {
    showFailToast(t('fieldRequired'));
    return;
  }
  
  // 验证表格选择
  if (tableOption.value === 'existing' && !selectedTableId.value) {
    showFailToast(t('selectTableRequired'));
    return;
  }
  
  loading.value = true;
  
  try {
    // 调用后端接口（根据平台动态构建接口路径）
    const endpoint = API_ENDPOINTS.getKeywordSearch(keywordFormData.platform);
    
    // ✨ 构建请求头，如果提供了 API Key 则添加，否则使用飞书用户ID
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // 如果提供了 API Key，添加 X-API-Key header
    if (apiKey.value && apiKey.value.trim()) {
      headers['X-API-Key'] = apiKey.value.trim();
    } else if (feishuUserId.value) {
      // 如果没有 API Key，使用原有的 X-Feishu-User-ID header
      headers['X-Feishu-User-ID'] = feishuUserId.value;
    }
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        platform: keywordFormData.platform,
        keyword: keywordFormData.keyword.trim(),
        sort_type: keywordFormData.sortType,
        publish_time: keywordFormData.publishTime,
        duration_filter: keywordFormData.durationFilter,
        extract_range: keywordFormData.extractRange,
        selected_fields: keywordFormData.selectedFields,
      }),
    });
    
    const result = await response.json();
    
    console.log('API Response:', result);
    
    if (result.code === 0 && result.data && result.data.videos) {
      console.log('Videos count:', result.data.videos.length);
      console.log('Selected fields:', keywordFormData.selectedFields);
      // 写入数据到表格
      await writeDataToTable(result.data.videos, keywordFormData.selectedFields, keywordFormData.platform);
      
      // 刷新用户信息（更新智能点余额）
      await getUserInfo();
    } else {
      showFailToast(result.msg || t('error'));
    }
  } catch (error) {
    console.error('Submit error:', error);
    showFailToast(t('error') + ': ' + error.message);
  } finally {
    loading.value = false;
  }
};

// 监听平台变化，自动更新字段选择和样式主题
watch(() => homepageFormData.platform, (newPlatform) => {
  homepageFormData.selectedFields = getDefaultSelectedFields(newPlatform);
  // 更新样式主题
  if (setStyleTheme) {
    setStyleTheme(newPlatform);
  }
});

watch(() => keywordFormData.platform, (newPlatform) => {
  keywordFormData.selectedFields = getDefaultSelectedFields(newPlatform);
  // 更新样式主题
  if (setStyleTheme) {
    setStyleTheme(newPlatform);
  }
});

// 监听标签页切换，同步样式主题
watch(() => activeTab.value, () => {
  const currentPlatform = activeTab.value === '0' 
    ? homepageFormData.platform 
    : keywordFormData.platform;
  if (setStyleTheme) {
    setStyleTheme(currentPlatform);
  }
});

// 监听 API Key 变化，如果勾选了"记住登录状态"，则保存到 localStorage
watch(apiKey, (newValue) => {
  if (rememberApiKey.value) {
    saveApiKeyToStorage(newValue);
  }
});

// 监听"记住登录状态"勾选框变化
watch(rememberApiKey, (isChecked) => {
  if (isChecked) {
    // 勾选时，保存当前 API Key 到 localStorage
    if (apiKey.value && apiKey.value.trim()) {
      saveApiKeyToStorage(apiKey.value);
    }
  } else {
    // 取消勾选时，删除 localStorage 中的 API Key
    removeApiKeyFromStorage();
  }
});

// 挂载时加载表格列表
// 根据飞书用户ID获取用户信息
const getUserInfo = async () => {
  try {
    // 获取飞书用户ID
    const userId = await bitable.bridge.getBaseUserId();
    feishuUserId.value = userId;
    
    // 小红书专用版本，平台固定为 'xiaohongshu'
    const serviceCode = getServiceCodeByPlatform('xiaohongshu');
    
    // 调用获取用户信息接口
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.getUserInfo()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feishu_user_id: userId,
        service_code: serviceCode, // 传递服务编码，后端返回小红书平台的智能点
      }),
    });
    
    const result = await response.json();
    
    if (result.code === 0 && result.data) {
      const userInfo = result.data;
      
      // 更新会员信息（使用新的字段结构）
      membershipInfo.plan = userInfo.current_plan_level || '免费版';
      membershipInfo.totalRemainingPoints = userInfo.total_remaining_points || 0;
      membershipInfo.validPeriodStart = userInfo.valid_period_start;
      membershipInfo.validPeriodEnd = userInfo.valid_period_end;
      
      console.log('User initialized:', userInfo, 'service_code:', serviceCode);
    } else {
      console.error('User init failed:', result.msg);
    }
  } catch (error) {
    console.error('Failed to init user:', error);
    // 初始化失败不影响使用，使用默认值
  }
};

// 格式化日期（YYYY-MM-DD）
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return dateStr;
  }
};

onMounted(async () => {
  // 从 localStorage 读取 API Key
  const savedApiKey = loadApiKeyFromStorage();
  if (savedApiKey) {
    apiKey.value = savedApiKey;
    // 如果从 localStorage 读取到了 API Key，自动勾选"记住登录状态"
    rememberApiKey.value = true;
  }
  
  // 获取用户信息（如果用户不存在则自动创建）
  await getUserInfo();
  loadTables();
  
  // 初始化样式主题（根据当前选中的标签页和平台）
  const currentPlatform = activeTab.value === '0' 
    ? homepageFormData.platform 
    : keywordFormData.platform;
  if (setStyleTheme) {
    setStyleTheme(currentPlatform);
  }
  
  // 监听表格删除事件，自动刷新表格列表
  bitable.base.onTableDelete((event) => {
    console.log('Table deleted event:', event);
    const deletedTableId = event?.data?.tableId || event?.tableId;
    
    // 如果删除的表格是当前选中的表格，清空选中状态
    if (selectedTableId.value && deletedTableId === selectedTableId.value) {
      selectedTableId.value = '';
      console.log('Deleted table was selected, clearing selection');
    }
    
    // 刷新表格列表
    loadTables();
  });
  
  // 监听表格添加事件，自动刷新表格列表
  bitable.base.onTableAdd((event) => {
    console.log('Table added, refreshing table list');
    loadTables();
  });
});
</script>

<template>
  <!-- 套餐选择页面 -->
  <MembershipPlan
    v-if="showMembershipPlan"
    :current-plan="currentPlan"
    :platform="activeTab === '0' ? homepageFormData.platform : keywordFormData.platform"
    @close="closeMembershipPlan"
    @purchase="handlePurchase"
  />
  
  <!-- 主表单页面 -->
  <div v-else class="form-container">
    <!-- 顶部头部 -->
    <div class="header-section">
      <div class="header-title">小红书博主关键词批量查询</div>
    </div>
    
    <div class="content-wrapper">
      <!-- 会员信息卡片 -->
      <div class="card membership-card">
        <div class="membership-row">
          <div class="membership-title">
            <span class="label">当前版本：</span>
            <span class="value">{{ membershipInfo.plan }}</span>
          </div>
        </div>
        
        <!-- 显示可用条数 -->
        <div v-if="membershipInfo.totalRemainingPoints > 0" class="membership-points-item">
          <span class="points-label">可用条数：</span>
          <span class="points-value">{{ membershipInfo.totalRemainingPoints }}</span>
        </div>
        
        <div class="membership-desc">
          {{ membershipInfo.desc }}
        </div>
        <div class="membership-actions">
          <el-button size="small" plain type="info" @click="openUserGroup">加入用户群</el-button>
          <el-button size="small" type="warning" @click="openMembershipPlan">购买会员</el-button>
        </div>
      </div>

      <!-- API Key 卡片 -->
      <div class="card">
        <div class="form-item">
          <div class="form-label">API Key</div>
          <div style="flex: 1;">
            <el-input
              v-model="apiKey"
              placeholder="请输入 API Key"
              clearable
              style="width: 100%"
            />
          </div>
          <el-button
            size="small"
            type="primary"
            @click="getApiKey"
            style="margin-left: 8px;"
          >
            获取api_key
          </el-button>
        </div>
        <div class="form-item" style="margin-top: 8px; margin-bottom: 0;">
          <el-checkbox v-model="rememberApiKey" style="margin-left: 0;">
            记住我的api key
          </el-checkbox>
        </div>
      </div>

      <!-- 表格选择卡片 -->
      <div class="card">
        <div class="form-item form-item-vertical">
          <div class="form-label">{{ t('tableOption') }}</div>
          <el-radio-group v-model="tableOption">
            <el-radio label="create">{{ t('createNewTable') }}</el-radio>
            <el-radio label="existing">{{ t('useExistingTable') }}</el-radio>
          </el-radio-group>
        </div>
        
        <!-- 使用现有表格 -->
        <div v-if="tableOption === 'existing'" class="form-item">
          <div class="form-label">{{ t('selectTable') }}</div>
          <div style="flex: 1;">
            <el-select
              v-model="selectedTableId"
              :placeholder="t('selectTablePlaceholder')"
              style="width: 100%"
            >
              <el-option
                v-for="table in tableMetaList"
                :key="table.value"
                :label="table.text"
                :value="table.value"
              />
            </el-select>
          </div>
        </div>
      </div>
      
      <!-- 数据获取表单卡片 -->
      <div class="card">
        <el-tabs v-model="activeTab" class="main-tabs">
          <!-- 主页批量获取 -->
          <el-tab-pane :label="t('tabHomepageBatch')" name="0">
            <div class="form">
          
              <!-- 平台选择（小红书专用版本，已隐藏，默认使用小红书） -->
              <!-- <div class="form-item">
                <div class="form-label">{{ t('platform') }}</div>
                <div style="flex: 1;">
                  <el-select
                    v-model="homepageFormData.platform"
                    :placeholder="t('platform')"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="opt in PLATFORM_OPTIONS"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </div>
              </div> -->
          
              <!-- 博主主页链接&博主ID -->
              <div class="form-item form-item-vertical">
                <div class="form-label">博主主页链接&博主ID</div>
                <div v-for="(entry, index) in homepageFormData.homepageEntries" :key="index" class="url-input-group">
                  <el-input
                    v-model="homepageFormData.homepageEntries[index]"
                    placeholder="请输入博主主页链接或博主ID"
                    clearable
                    style="width: 100%"
                  >
                    <template v-if="homepageFormData.homepageEntries.length > 1" #append>
                      <el-button
                        type="danger"
                        size="small"
                        @click="removeHomepageEntry(index)"
      >
                        删除
                      </el-button>
                    </template>
                  </el-input>
                </div>
                <el-button
                  plain
                  size="small"
                  @click="addHomepageEntry"
                  class="add-link-btn"
                >
                  + {{ t('addLink') }}
                </el-button>
              </div>
              
              <!-- 数据范围 -->
              <div class="form-item">
                <div class="form-label">{{ t('extractRange') }}</div>
                <div style="flex: 1;">
                  <el-select
                    v-model="homepageFormData.extractRange"
                    :placeholder="t('extractRange')"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="opt in EXTRACT_RANGE_OPTIONS"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </div>
              </div>
              
              <!-- 字段选择折叠面板 -->
              <el-collapse v-model="fieldsCollapse" class="fields-collapse">
                <el-collapse-item :title="t('selectFields')" name="1">
                  <el-checkbox-group v-model="homepageFormData.selectedFields">
                    <div v-for="field in getCurrentFieldOptions" :key="field.key" class="field-checkbox-item">
                      <el-checkbox
                        :label="field.key"
                        :disabled="field.required"
                      >
                        {{ field.label }}
                      </el-checkbox>
                    </div>
                  </el-checkbox-group>
                </el-collapse-item>
              </el-collapse>
              
              <!-- 提交按钮 -->
              <el-button
                type="primary"
                :loading="loading"
                @click="handleHomepageSubmit"
                class="submit-btn"
                style="width: 100%"
              >
                {{ loading ? t('loading') : t('submit') }}
              </el-button>
            </div>
          </el-tab-pane>
          
          <!-- 关键词搜索获取 -->
          <el-tab-pane :label="t('tabKeywordSearch')" name="1">
            <div class="form">
              <!-- 平台选择（小红书专用版本，已隐藏，默认使用小红书） -->
              <!-- <div class="form-item">
                <div class="form-label">{{ t('platform') }}</div>
                <div style="flex: 1;">
                  <el-select
                    v-model="keywordFormData.platform"
                    :placeholder="t('platform')"
                    style="width: 100%"
      >
                    <el-option
                      v-for="opt in PLATFORM_OPTIONS"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </div>
              </div> -->
              
              <!-- 关键词 -->
              <div class="form-item">
                <div class="form-label">{{ t('keyword') }}</div>
                <div style="flex: 1;">
                  <el-input
                    v-model="keywordFormData.keyword"
                    :placeholder="t('keywordPlaceholder')"
                    clearable
                  />
                </div>
              </div>
              
              <!-- 高级选项折叠面板 -->
              <el-collapse v-model="advancedSettingsCollapse" class="advanced-settings">
                <el-collapse-item :title="t('advancedSettings')" name="1">
                  <!-- 排序方式 -->
                  <div class="form-item">
                    <div class="form-label">{{ t('sortType') }}</div>
                    <div style="flex: 1;">
                      <el-select
                        v-model="keywordFormData.sortType"
                        :placeholder="t('sortType')"
                        style="width: 100%"
                      >
                        <el-option
                          v-for="opt in SORT_TYPE_OPTIONS"
                          :key="opt.value"
                          :label="opt.label"
                          :value="opt.value"
                        />
                      </el-select>
                    </div>
                  </div>
                  
                  <!-- 发布时间 -->
                  <div class="form-item">
                    <div class="form-label">{{ t('publishTime') }}</div>
                    <div style="flex: 1;">
                      <el-select
                        v-model="keywordFormData.publishTime"
                        :placeholder="t('publishTime')"
                        style="width: 100%"
      >
                        <el-option
                          v-for="opt in PUBLISH_TIME_OPTIONS"
                          :key="opt.value"
                          :label="opt.label"
                          :value="opt.value"
                        />
                      </el-select>
                    </div>
                  </div>
                  
                  <!-- 筛选时长 -->
                  <div class="form-item">
                    <div class="form-label">{{ t('durationFilter') }}</div>
                    <div style="flex: 1;">
                      <el-select
                        v-model="keywordFormData.durationFilter"
                        :placeholder="t('durationFilter')"
                        style="width: 100%"
                      >
                        <el-option
                          v-for="opt in DURATION_FILTER_OPTIONS"
                          :key="opt.value"
                          :label="opt.label"
                          :value="opt.value"
                        />
                      </el-select>
                    </div>
                  </div>
                  
                  <!-- 数据范围 -->
                  <div class="form-item">
                    <div class="form-label">{{ t('extractRange') }}</div>
                    <div style="flex: 1;">
                      <el-select
                        v-model="keywordFormData.extractRange"
                        :placeholder="t('extractRange')"
                        style="width: 100%"
                      >
          <el-option
                          v-for="opt in EXTRACT_RANGE_OPTIONS"
                          :key="opt.value"
                          :label="opt.label"
                          :value="opt.value"
          />
        </el-select>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
              
              <!-- 字段选择折叠面板 -->
              <el-collapse v-model="fieldsCollapse" class="fields-collapse">
                <el-collapse-item :title="t('selectFields')" name="1">
                  <el-checkbox-group v-model="keywordFormData.selectedFields">
                    <div v-for="field in getCurrentFieldOptions" :key="field.key" class="field-checkbox-item">
                      <el-checkbox
                        :label="field.key"
                        :disabled="field.required"
                      >
                        {{ field.label }}
                      </el-checkbox>
                    </div>
                  </el-checkbox-group>
                </el-collapse-item>
              </el-collapse>
              
              <!-- 提交按钮 -->
              <el-button
                type="primary"
                :loading="loading"
                @click="handleKeywordSubmit"
                class="submit-btn"
                style="width: 100%"
              >
                {{ loading ? t('loading') : t('submit') }}
              </el-button>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 飞书侧边栏插件设计规范样式 - 支持抖音/小红书主题 */
.form-container {
  padding: 0;
  min-height: 100vh;
  background: var(--style-bg-primary);
  color: var(--style-text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 内容区域包装器 */
.content-wrapper {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px; /* 小红书风格：纵向间距16px */
}

/* 卡片样式 */
.card {
  background: var(--style-bg-content);
  border-radius: 8px; /* 小红书风格：圆角8px */
  padding: 16px;
  box-shadow: var(--style-card-shadow);
  border: 1px solid var(--style-border);
  transition: background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

/* 会员信息卡片 */
.membership-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.membership-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.membership-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--style-text-primary);
}

.membership-title .label {
  color: var(--style-text-secondary);
  font-weight: 500;
}

.membership-title .value {
  margin-left: 4px;
  color: var(--style-color-accent);
}

.membership-points {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--style-text-primary);
}

.membership-points-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--style-text-primary);
  margin-top: 4px;
}

.points-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--style-color-secondary);
}

/* 小红书主题：可用条数使用主强调色（火红色），确保清晰可见 */
:root[data-theme="xiaohongshu"] .points-value {
  color: #FF2442;
}

/* 抖音主题：可用条数使用湖蓝色，保持原有风格 */
:root[data-theme="douyin"] .points-value {
  color: #00FFFF;
}

.points-hint {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--style-border);
  color: var(--style-text-secondary);
  font-size: 12px;
  cursor: default;
}

.membership-desc {
  font-size: 13px;
  color: var(--style-text-secondary);
  line-height: 1.5;
}

.membership-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 顶部头部 */
.header-section {
  background: var(--style-gradient-main);
  color: #fff;
  padding: 16px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  transition: background 0.3s ease;
}

/* 小红书风格：标题使用纯色背景 */
:root[data-theme="xiaohongshu"] .header-section {
  background: var(--style-color-accent);
}

.header-icon {
  font-size: 20px;
  line-height: 1;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.5;
}

.main-tabs {
  margin: 0;
  margin-bottom: 16px;
}

.form {
  padding: 0;
}

.form-item {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-item:last-child {
    margin-bottom: 0;
  }

/* 垂直布局的表单项（如表格选择、博主主页链接） */
.form-item-vertical {
  flex-direction: column;
  align-items: flex-start;
}

.form-item-vertical .form-label {
  margin-bottom: 8px;
  width: auto;
  min-width: auto;
}

.form-label {
  font-size: 13px;
  color: var(--style-text-primary);
  margin-bottom: 0;
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;
  flex-shrink: 0;
  width: 70px;
  min-width: 70px;
}

.url-input-group {
  margin-bottom: 8px;
  width: 100%;
}

.url-input-group .el-input {
  width: 100%;
}

.add-link-btn {
  margin-top: 8px;
  width: 100%;
  border: 1px dashed var(--style-border);
  color: var(--style-text-secondary);
  background-color: var(--style-bg-content);
}

.add-link-btn:active {
  background-color: var(--style-active-bg);
}

.add-link-btn:hover {
  background-color: var(--style-hover-bg);
  border-color: var(--style-color-accent);
}

.advanced-settings {
  margin-bottom: 16px;
}

.fields-collapse {
  margin-bottom: 16px;
}

.field-checkbox-item {
  margin-bottom: 12px;
  padding: 8px 0;
}

.submit-btn {
  margin-top: 16px;
  width: 100%;
}

/* Element Plus 组件样式优化 - 适配竖屏窄屏 */
:deep(.el-tabs__header) {
  margin: 0 0 16px 0;
  background: var(--style-bg-content);
  border-radius: 8px;
  padding: 4px;
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

:deep(.el-tabs__nav) {
  width: 100%;
  display: flex;
}

:deep(.el-tabs__item) {
  font-size: 13px;
  padding: 10px 12px;
  height: 40px;
  line-height: 20px;
  flex: 1;
  text-align: center;
  justify-content: center;
}

:deep(.el-tabs__item) {
  color: var(--style-text-secondary);
}

:deep(.el-tabs__item.is-active) {
  color: var(--style-color-accent);
  font-weight: 600;
}

:deep(.el-tabs__active-bar) {
  background-color: var(--style-color-accent);
  height: 2px;
}

:deep(.el-tabs__item:hover) {
  color: var(--style-color-accent);
}

/* 输入框样式 - 紧凑 */
:deep(.el-input) {
  font-size: 13px;
}

:deep(.el-input__wrapper) {
  padding: 4px 12px;
  min-height: 32px;
  background-color: var(--style-bg-primary);
  box-shadow: 0 0 0 1px var(--style-border) inset;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  border-radius: 4px; /* 小红书风格：输入框圆角 */
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--style-color-secondary) inset; /* 小红书风格：使用次要强调色作为悬停边框 */
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--style-color-accent) inset; /* 小红书风格：聚焦时使用主强调色 */
}

:deep(.el-input__inner) {
  color: var(--style-text-primary);
}

:deep(.el-input__inner) {
  font-size: 13px;
  height: 24px;
  line-height: 24px;
  color: var(--style-text-primary);
}

:deep(.el-input__inner::placeholder) {
  color: var(--style-text-placeholder);
}

:deep(.el-textarea__inner) {
  color: var(--style-text-primary);
  background-color: var(--style-bg-primary);
}

:deep(.el-textarea__inner::placeholder) {
  color: var(--style-text-placeholder);
}

/* 下拉选择框样式 - 紧凑 */
:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input__wrapper) {
  padding: 4px 12px;
  min-height: 32px;
  background-color: var(--style-bg-primary);
  box-shadow: 0 0 0 1px var(--style-border) inset;
  border-radius: 4px; /* 小红书风格：选择框圆角 */
}

:deep(.el-select .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--style-color-secondary) inset;
}

:deep(.el-select .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--style-color-accent) inset;
}

:deep(.el-select .el-input__inner) {
  color: var(--style-text-primary);
}

:deep(.el-select .el-input__inner::placeholder) {
  color: var(--style-text-placeholder);
}

/* 确保下拉菜单选项文字在所有主题下都可见 */
:deep(.el-select-dropdown) {
  background-color: var(--style-bg-content) !important;
}

:deep(.el-select-dropdown__item) {
  color: var(--style-text-primary) !important;
}

/* 抖音主题：强制白色文字 */
:root[data-theme="douyin"] :deep(.el-select-dropdown__item) {
  color: #FFFFFF !important;
}

:root[data-theme="douyin"] :deep(.el-select-dropdown__item.selected) {
  color: #FF66CC !important;
}

:root[data-theme="douyin"] :deep(.el-select-dropdown__item:hover) {
  color: #FFFFFF !important;
  background-color: rgba(255, 102, 204, 0.15) !important;
}

/* 单选按钮组样式 */
:deep(.el-radio-group) {
  display: flex;
  gap: 12px;
  width: 100%;
}

:deep(.el-radio) {
  flex: 1;
  margin-right: 0;
}

:deep(.el-radio__label) {
  font-size: 13px;
  padding-left: 6px;
  color: var(--style-text-primary);
}

:deep(.el-radio__input:not(.is-checked) + .el-radio__label) {
  color: var(--style-text-primary);
}

:deep(.el-radio__input.is-checked .el-radio__inner) {
  background-color: var(--style-color-accent);
  border-color: var(--style-color-accent);
}

:deep(.el-radio__input.is-checked + .el-radio__label) {
  color: var(--style-color-accent);
}

/* 折叠面板样式 */
:deep(.el-collapse-item__header) {
  font-size: 13px;
  font-weight: 500;
  padding: 10px 12px;
  height: auto;
  line-height: 1.5;
  background-color: var(--style-bg-content);
  color: var(--style-text-primary);
  border-color: var(--style-border);
}

:deep(.el-collapse-item__header:hover) {
  background-color: var(--style-hover-bg);
}

:deep(.el-collapse-item__content) {
  padding: 12px;
  font-size: 13px;
  background-color: var(--style-bg-content);
  color: var(--style-text-primary);
}

/* 复选框样式 */
:deep(.el-checkbox) {
  margin-bottom: 8px;
}

:deep(.el-checkbox__label) {
  font-size: 13px;
  line-height: 1.5;
  padding-left: 6px;
  color: var(--style-text-primary);
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--style-color-accent);
  border-color: var(--style-color-accent);
}

:deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: var(--style-text-primary);
}

/* 按钮样式 - 紧凑 */
:deep(.el-button) {
  font-size: 14px;
  padding: 8px 16px;
  height: 36px;
  transition: all 0.3s ease;
  border-radius: 4px; /* 小红书风格：按钮圆角 */
  font-weight: 500; /* 小红书风格：按钮文字中粗体 */
}

:deep(.el-button--primary) {
  background: var(--style-gradient-main);
  border: none;
  color: #fff;
}

/* 小红书风格：主要按钮使用纯色背景 */
:root[data-theme="xiaohongshu"] :deep(.el-button--primary) {
  background: var(--style-color-accent);
  border: none;
  color: #fff;
}

/* 抖音风格：主要按钮使用渐变 */
:root[data-theme="douyin"] :deep(.el-button--primary) {
  background: var(--style-gradient-main);
  border: none;
  color: #fff;
}

:deep(.el-button--primary:hover) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 36, 66, 0.3);
}

:deep(.el-button--primary:active) {
  transform: translateY(0);
  opacity: 0.8;
}

:deep(.el-button--warning) {
  background-color: var(--style-color-accent);
  border-color: var(--style-color-accent);
  color: #fff;
}

/* 小红书风格：边框按钮（如"关注"按钮样式） */
:deep(.el-button.is-plain:not(.el-button--primary):not(.el-button--warning)) {
  background-color: #fff;
  border: 1px solid var(--style-color-accent);
  color: var(--style-color-accent);
}

:deep(.el-button--small) {
  font-size: 12px;
  padding: 6px 12px;
  height: 28px;
}

/* 按钮文本颜色 */
:deep(.el-button:not(.el-button--primary):not(.el-button--warning):not(.el-button--danger)) {
  color: var(--style-text-primary);
  border-color: var(--style-border);
  background-color: transparent;
}

:deep(.el-button.is-plain) {
  color: var(--style-text-primary);
  border-color: var(--style-border);
  background-color: transparent;
}

:deep(.el-button.is-plain:hover) {
  color: var(--style-color-accent);
  border-color: var(--style-color-accent);
  background-color: var(--style-hover-bg);
}

:deep(.el-button.is-plain:active) {
  color: var(--style-color-accent);
  border-color: var(--style-color-accent);
  background-color: var(--style-active-bg);
}

/* 标签页文本颜色增强 */
:deep(.el-tabs__item) {
  color: var(--style-text-secondary);
  font-weight: 400; /* 小红书风格：标签页常规字体 */
}

:deep(.el-tabs__item:hover) {
  color: var(--style-text-primary);
}

:deep(.el-tabs__item.is-active) {
  font-weight: 600; /* 小红书风格：选中标签页加粗 */
}

/* 确保卡片内所有文本都清晰可见 */
.card {
  color: var(--style-text-primary);
}

/* 覆盖 Element Plus 组件的默认文本颜色 */
.card :deep(.el-input__inner),
.card :deep(.el-textarea__inner),
.card :deep(.el-select__input),
.card :deep(.el-radio__label),
.card :deep(.el-checkbox__label),
.card :deep(.el-collapse-item__header) {
  color: var(--style-text-primary);
}
</style>
