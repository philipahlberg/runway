import { Path } from 'lib';

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
  });

  describe('#matched', () => {
    it('returns the matched part', () => {
      const a = new Path('/');
      expect(a.matched('/a/b')).to.equal('/');
      const b = new Path('/abc');
      expect(b.matched('/abc/xyz')).to.equal('/abc');
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
      expect(params.values).to.deep.equal(['1', '2']);
      expect(params.keys).to.deep.equal(['a', 'b']);
      expect(params.all()).to.deep.equal({ a: '1', b: '2' });
      expect(params.entries()).to.deep.equal([['a', '1'], ['b', '2']]);
    });
  
    it('returns an iterable', () => {
      const path = new Path('/:a/:b');
      const params = path.parse('/1/2');
      let keys = [];
      let values = [];

      for (const [key, value] of params) {
        keys.push(key);
        values.push(value);
      }
  
      expect(keys.length).to.equal(2);
      expect(values.length).to.equal(2);
      expect(keys).to.deep.equal(['a', 'b']);
      expect(values).to.deep.equal(['1', '2']);
    });
  });


});