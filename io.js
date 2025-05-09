let io = null;

function setIO(ioInstance) {
  io = ioInstance;
}

function getIO() {
  if (!io) throw new Error("error");
  return io;
}

module.exports = { setIO, getIO };