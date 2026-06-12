const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  userId: String,
  name:   String,
  color:  String,
  text:   String,
  time:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
