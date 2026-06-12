const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomId:     { type: String, unique: true, required: true },
  createdAt:  { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', RoomSchema);
