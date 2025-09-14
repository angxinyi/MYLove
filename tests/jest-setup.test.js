// Simple test to verify Jest is working
describe('Basic Jest Setup', () => {
  test('Jest is working correctly', () => {
    expect(1 + 1).toBe(2);
  });

  test('String matching works', () => {
    const testString = "Hello, World!";
    expect(testString).toContain("World");
  });

  test('Array operations work', () => {
    const fruits = ['apple', 'banana', 'orange'];
    expect(fruits).toHaveLength(3);
    expect(fruits).toContain('banana');
  });

  test('Date operations work', () => {
    const now = new Date();
    expect(now instanceof Date).toBe(true);
  });
});