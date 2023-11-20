let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, global)
let sqliteUtil = singletonRequire('SQLiteUtil')
let filePath = files.cwd() + '/testTable.db'

const createDbConfig = sqliteUtil.createDbConfig
const PARSER = sqliteUtil.PARSER
/**
 * 方式1，完全自己指定建表语句和相应的转换代码，建议使用方式2自动创建建表语句
 */
let COMPLEX_TABLE = {
  // 指定表名
  tableName: 'COMPLEX_TABLE',
  // 指定建表语句
  tableCreate: `
  CREATE TABLE COMPLEX_TABLE (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    CUST_NAME VARCHAR(32) NULL,
    AGE INTEGER NULL,
    CREATE_TIME BIGINT NOT NULL,
    MODIFY_TIME BIGINT NOT NULL
  )
  `,
  // 初始化时的更新语句，因为建表语句只会执行一条，可以将创建索引的放到alters中
  tableAlters: [
    'ALTER TABLE COMPLEX_TABLE ADD COLUMN SEX VARCHAR(2)',
    'create index idx_cust_name on COMPLEX_TABLE (CUST_NAME)',
    // 对于后续版本更新，可以使用如下语句，指定数据库版本号，如果当前版本号小于指定版本号，则执行更新语句
    { version: 2, sql: 'create index idx_cust_age on COMPLEX_TABLE (CUST_NAME,AGE)' }
  ],
  // 定义参数和表字段的映射关系 以及JS类型转Java
  // COLUMN_NAME: [参数名, js=>java转换函数, java=>js转换函数] 如第三个参数不指定，则需要定义modelConverter，否则会报错
  columnMapping: {
    ID: ['id', value => new java.lang.Integer(parseInt(value))],
    CUST_NAME: ['custName', value => value],
    AGE: ['age', value => new java.lang.Integer(parseInt(value))],
    SEX: ['sex', value => value],
    CREATE_TIME: ['createTime', value => new java.lang.Long(value.getTime())],
    MODIFY_TIME: ['modifyTime', value => new java.lang.Long(value.getTime())],
  },
  // 定义查询结果cursor到JS对象的转换 字段顺序和columnMapping匹配
  modelConverter: function (cursor) {
    return {
      id: cursor.getInt(0),
      custName: cursor.getString(1),
      age: cursor.getInt(2),
      sex: cursor.getString(3),
      // 日期使用时间戳保存
      createTime: new Date(cursor.getLong(4)),
      modifyTime: new Date(cursor.getLong(5)),
    }
  }
}
/**
 * 方式2，使用createDbConfig自动生成建表语句，不需要指定tableCreate、tableAlters以及modelConverter
 */
let SIMPLE_DEFINE_TABLE = createDbConfig({
  // 指定表名
  tableName: 'SIMPLE_DEFINE_TABLE',
  // 指定表变更语句
  tableAlters: [
    'create index idx_define_date on SIMPLE_DEFINE_TABLE(DEFINE_DATE)'
  ],
  // 指定表字段定义，指定字段名、类型、是否非空、默认值、转换函数等
  fieldConfig: {
    id: { column: 'ID', type: 'INTEGER', primaryKey: true, autoIncrement: true, parser: PARSER.Integer },
    defineDate: { column: 'DEFINE_DATE', type: 'VARCHAR(10)', notNull: true, parser: PARSER.String },
    description: { column: 'DESCRIPTION', type: 'VARCHAR(100)', defaultVal:'无', parser: PARSER.String },
    createTime: { column: 'CREATE_TIME', type: 'DATETIME', parser: PARSER.Date },
  }
})

// 初始化数据库
sqliteUtil.initDbTables(filePath, [COMPLEX_TABLE, SIMPLE_DEFINE_TABLE], 2)
// 创建表dao
let complexDao = sqliteUtil.createDao(COMPLEX_TABLE.tableName)
let simpleDao = sqliteUtil.createDao(SIMPLE_DEFINE_TABLE.tableName)
// 插入
let id = complexDao.insert({
  custName: '测试插入名称',
  age: 19,
  sex: '男',
  createTime: new Date(),
  modifyTime: new Date()
})

// 根据id获取数据
let recordResult = complexDao.selectById(id)
console.log('查询数据内容 id:',id, ' 对象：', JSON.stringify(recordResult))

// 更新
console.log('更新结果', complexDao.updateById(id, {
  custName: '测试修改名称',
  sex: '女',
  age: 20
}))

// 查询总数 无参数
console.log('总记录数：', complexDao.count(null, null))

// 查询所有结果
let listResult = complexDao.query(null, null)
console.log('总结果数：', listResult.length, ' 结果集：', JSON.stringify(listResult))

// 删除
console.log('删除结果', complexDao.deleteById(id))

// 查询总数 无参数
console.log('删除后总记录数：', complexDao.count(null, null))

// 查询所有结果
listResult = complexDao.query(null, null)
console.log('删除后总结果数：', listResult.length, ' 结果集：', JSON.stringify(listResult))

// 更多使用方式见SQLiteUtil源代码