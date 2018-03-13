import { Query } from 'runway';

describe('Query', () => {
  describe('.from', () => {
    it('constructs a query from an object', () => {
      const query = Query.from({
        a: 1,
        b: 2
      });

      expect(query.get('a')).to.equal(1);
      expect(query.get('b')).to.equal(2);
    });
  });

  describe('.parse', () => {
    it('parses a regular string with a single value', () => {
      const query = Query.parse('a=1');

      expect(query.get('a')).to.equal('1');
      expect(query.all()).to.deep.equal({ a: '1' });
    });

    it('parses a regular string with multiple values', () => {
      const query = Query.parse('a=1&b=2');

      expect(query.get('a')).to.equal('1');
      expect(query.get('b')).to.equal('2');
      expect(query.all()).to.deep.equal({ a: '1', b: '2' });
    });

    it('parses a search string', () => {
      const query = Query.parse('?a=1&b=2');

      expect(query.get('a')).to.equal('1');
      expect(query.get('b')).to.equal('2');
      expect(query.all()).to.deep.equal({ a: '1', b: '2' });
    });

    it('parses a pathname + search string', () => {
      const query = Query.parse('/abc?a=1&b=2');

      expect(query.get('a')).to.equal('1');
      expect(query.get('b')).to.equal('2');
      expect(query.all()).to.deep.equal({ a: '1', b: '2' });
    });

    it('parses a pathname + search + hash string', () => {
      const query = Query.parse('/abc?a=1&b=2');

      expect(query.get('a')).to.equal('1');
      expect(query.get('b')).to.equal('2');
      expect(query.all()).to.deep.equal({ a: '1', b: '2' });
    });
  });

  describe('#toString', () => {
    it('converts to query object to a query string', () => {
      const query = new Query([
        ['a', 1],
        ['b', 2]
      ]);

      const string = query.toString();
      expect(string).to.equal('a=1&b=2');
    });
  });
});