package com.whereisanton.www.whereisanton;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Criteria;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.AsyncTask;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.FragmentActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.Toast;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class LocationActivity
    extends FragmentActivity
    implements OnMapReadyCallback, LocationListener, OnClickListener
{
    private static final String S_URL = "https://where-is-anton.appspot.com/locations/";
    private static final String S_TAG = "whereisanton";

    private GoogleMap m_map;
    private Button m_button;

    private LocationManager m_manager;
    private String m_provider;

    private Location m_lastLocation = null;
    private String m_lastAddress = "";

    @Override
    protected void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_location);

        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
            .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);
    }

    @Override
    public void onPause()
    {
        super.onPause();

        int perm = ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION);

        if ((perm == PackageManager.PERMISSION_GRANTED) && (m_manager != null))
        {
            Log.i(S_TAG, "Stopping location updates");
            m_manager.removeUpdates(this);
        }
    }

    @Override
    public void onResume()
    {
        super.onResume();

        int perm = ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION);

        if ((perm == PackageManager.PERMISSION_GRANTED) && (m_manager != null))
        {
            Log.i(S_TAG, "Resuming location updates");
            m_manager.requestLocationUpdates(m_provider, 20000, 0.0f, this);
        }
    }

    @Override
    public void onMapReady(GoogleMap googleMap)
    {
        m_button = (Button) findViewById(R.id.button);
        m_map = googleMap;

        int perm = ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION);

        if (perm == PackageManager.PERMISSION_GRANTED)
        {
            m_manager = (LocationManager) getSystemService(LOCATION_SERVICE);
            Criteria criteria = new Criteria();

            m_provider = m_manager.getBestProvider(criteria, true);

            Location location = m_manager.getLastKnownLocation(m_provider);
            onLocationChanged(location);

            m_manager.requestLocationUpdates(m_provider, 20000, 0.0f, this);
        }
    }

    @Override
    public void onLocationChanged(Location location)
    {
        Log.i(S_TAG, "Location changed to: " + location.toString());

        if (m_map != null)
        {
            Geocoder coder = new Geocoder(this, Locale.getDefault());
            m_lastLocation = location;

            try
            {
                List<Address> addresses = coder.getFromLocation(
                    m_lastLocation.getLatitude(),
                    m_lastLocation.getLongitude(),
                    1
                );

                String state = addresses.get(0).getAddressLine(1);
                String country = addresses.get(0).getAddressLine(2);
                m_lastAddress = state + ", " + country;
            }
            catch (IOException e)
            {
                Log.e(S_TAG, e.getMessage());
                m_lastAddress = "";
            }

            LatLng pos = new LatLng(m_lastLocation.getLatitude(), m_lastLocation.getLongitude());

            m_map.moveCamera(CameraUpdateFactory.newLatLng(pos));
            m_map.animateCamera(CameraUpdateFactory.zoomTo(5.0f));
            m_map.clear();

            m_button.setClickable(true);

            Marker marker = m_map.addMarker(new MarkerOptions().position(pos));
            marker.setTitle(m_lastAddress);
            marker.showInfoWindow();
        }
        else
        {
            m_button.setClickable(false);
        }
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras)
    {
    }

    @Override
    public void onProviderEnabled(String provider)
    {
    }

    @Override
    public void onProviderDisabled(String provider)
    {
    }

    @Override
    public void onClick(View v)
    {
        if (m_lastLocation == null)
        {
            Log.w(S_TAG, "No location available");
            return;
        }

        new PostTask().execute(
            m_lastAddress,
            String.valueOf(m_lastLocation.getLatitude()),
            String.valueOf(m_lastLocation.getLongitude())
        );
    }

    private class PostTask extends AsyncTask<String, String, Integer>
    {
        protected Integer doInBackground(String... data)
        {
            Log.i(S_TAG, "Sending to: " + data[0]);
            final int maxTries = 10;

            for (int i = 0; i < maxTries; ++i)
            {
                try
                {
                    URL url = new URL(S_URL);

                    Map<String, String> params = new LinkedHashMap<>();
                    params.put("address", data[0]);
                    params.put("latitude", data[1]);
                    params.put("longitude", data[2]);

                    return makeHttpPost(url, params);
                }
                catch (Exception e)
                {
                    Log.e(S_TAG, e.getMessage());
                }
            }

            return -1;
        }

        @Override
        protected void onPostExecute(Integer result)
        {
            Context context = getApplicationContext();
            int length = Toast.LENGTH_LONG;

            Toast toast;

            if (result == HttpURLConnection.HTTP_OK)
            {
                toast = Toast.makeText(context, "Location update sent", length);
            }
            else
            {
                toast = Toast.makeText(context, "Error sending update, try again", length);
            }

            toast.show();
        }

        private int makeHttpPost(URL url, Map<String, String> params) throws Exception
        {
            StringBuilder postData = new StringBuilder();
            for (Map.Entry<String, String> param : params.entrySet())
            {
                if (postData.length() != 0)
                {
                    postData.append('&');
                }

                postData.append(URLEncoder.encode(param.getKey(), "UTF-8"));
                postData.append('=');
                postData.append(URLEncoder.encode(param.getValue(), "UTF-8"));
            }

            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            byte[] bytes = postData.toString().getBytes("UTF-8");

            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            conn.setRequestProperty("Content-Length", String.valueOf(bytes.length));
            conn.setDoOutput(true);
            conn.getOutputStream().write(bytes);

            Log.i(S_TAG, "Response code: " + conn.getResponseCode());
            Log.i(S_TAG, "Response text: " + conn.getResponseMessage());

            return conn.getResponseCode();
        }
    }
}