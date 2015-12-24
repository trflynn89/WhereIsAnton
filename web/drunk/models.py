from google.appengine.ext import db

class Drunks(db.Model):

    time = db.DateTimeProperty(auto_now_add=True)
    drunk = db.BooleanProperty()

    @staticmethod
    def GetLastDrunk():
        query = db.GqlQuery('SELECT * FROM Drunks ORDER BY time DESC')
        return query.get()

