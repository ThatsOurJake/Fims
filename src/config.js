export default {
  port: process.env.PORT || 3000,
  mongo: {
    host: process.env.MONGO_HOST || 'localhost',
    port: parseInt(process.env.MONGO_PORT, 10) || 27017,
    dbName: 'fims'
  }
}