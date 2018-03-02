import { Query } from 'lib';

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

  describe('.of', () => {
    it('constructs a query out of tuples', () => {
      const query = Query.of(['a', 1], ['b', 2]);

      expect(query.get('a')).to.equal(1);
      expect(query.get('b')).to.equal(2);
    });
  });

  describe('.parse', () => {
    it('constructs a query from a string', () => {
      const query = Query.parse('?a=1&b=2');
      expect(query.get('a')).to.equal('1');
      expect(query.get('b')).to.equal('2');
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