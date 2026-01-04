// Mock for anime.js library in tests
const animeMock = {
  default: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    restart: jest.fn(),
    reverse: jest.fn(),
    seek: jest.fn(),
    finished: Promise.resolve(),
    duration: 1000,
    currentTime: 0,
    progress: 0,
    reversed: false,
  })),
  timeline: jest.fn(() => ({
    add: jest.fn().mockReturnThis(),
    play: jest.fn(),
    pause: jest.fn(),
    restart: jest.fn(),
    reverse: jest.fn(),
    seek: jest.fn(),
    finished: Promise.resolve(),
    duration: 1000,
    currentTime: 0,
    progress: 0,
    reversed: false,
  })),
};

// Support both named and default exports
module.exports = animeMock;
module.exports.default = animeMock.default;
module.exports.timeline = animeMock.timeline;
