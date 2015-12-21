from google.appengine.ext import db

class Location(db.Model):

    time = db.DateTimeProperty(auto_now_add=True)
    address = db.StringProperty()
    latitude = db.FloatProperty()
    longitude = db.FloatProperty()

    @staticmethod
    def GetAllLocations():
        query = db.GqlQuery('SELECT * FROM Location ORDER BY time DESC')
        return query.fetch(None)

    @staticmethod
    def GetLastLocation():
        query = db.GqlQuery('SELECT * FROM Location ORDER BY time DESC')
        return query.get()

