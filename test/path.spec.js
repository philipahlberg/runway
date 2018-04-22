import { Path } from '../dist/index.js';

describe('Path', () => {
  describe('#matches', () => {
    it('matches a simple path', () => {
      const path = new Path('/a');
      expect(path.matches('/a')).to.be.true;
    });
  
    it('matches exactly', () => {
      const path = new Path('/a', true);
      expect(path.matches('/a')).to.be.true;
      expect(path.matches('/a/b')).to.be.false;
      expect(path.matches('/ab')).to.be.false;
    });

    it('ignores query', () => {
      const path = new Path('/a');
      expect(path.matches('/a?q=123')).to.be.true;
    });

    it('ignores hash', () => {
      const path = new Path('/a');
      expect(path.matches('/a#hash')).to.be.true;
    });
  });

  describe('#matched', () => {
    it('returns the matched part', () => {
      const a = new Path('/');
      expect(a.matched('/a/b')).to.equal('/');
      const b = new Path('/abc');
      expect(b.matched('/abc/xyz')).to.equal('/abc');
    });

    it('ignores query', () => {
      const path = new Path('/abc');
      expect(path.matched('/abc?q=123')).to.equal('/abc');
    });

    it('ignores hash', () => {
      const path = new Path('/abc');
      expect(path.matched('/abc#hash')).to.equal('/abc');
    });
  });

  describe('#parse', () => {
    it('can parse a named parameter', () => {
      const path = new Path('/:param');
      const params = path.parse('/123');
      expect(params.get('param')).to.equal('123');
    });
  
    it('can parse multiple named parameters', () => {
      const path = new Path('/:a/:b');
      const params = path.parse('/1/2');
      expect(params.get('a')).to.equal('1');
      expect(params.get('b')).to.equal('2');
    });
  });
});