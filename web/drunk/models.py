from google.appengine.ext import db

class Drunks(db.Model):

    time = db.DateTimeProperty(auto_now_add=True)
    drunk = db.BooleanProperty()

    @staticmethod
    def GetAllDrunks(limit, ancestor=None):
        if ancestor:
            query = db.GqlQuery('SELECT * FROM Drunks WHERE ANCESTOR IS :1 ORDER BY time DESC', ancestor)
        else:
            query = db.GqlQuery('SELECT * FROM Drunks ORDER BY time DESC')

        return query.fetch(limit)

    @staticmethod
    def GetLastDrunk():
        query = db.GqlQuery('SELECT * FROM Drunks ORDER BY time DESC')
        return query.get()
