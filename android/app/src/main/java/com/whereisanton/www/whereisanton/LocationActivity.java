package com.whereisanton.www.whereisanton;

import android.location.Address;
import android.location.Criteria;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.support.v4.app.FragmentActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;

import java.io.IOException;
import java.util.List;
import java.util.Locale;

public class LocationActivity
    extends FragmentActivity
    implements OnMapReadyCallback, LocationListener
{
    private GoogleMap m_map;
    private Button m_button;

    private LocationManager m_manager;
    private String m_provider;

    private Location m_lastLocation = null;
    private String m_lastAddress = null;

    private ApiManager m_apiManager;

    @Override
    protected void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_location);

        m_apiManager = new ApiManager(getApplicationContext());

        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
            .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);
    }

    @Override
    public void onPause()
    {
        super.onPause();

        if (m_manager != null)
        {
            Log.i(Constants.S_TAG, "Stopping location updates");
            m_manager.removeUpdates(this);
        }
    }

    @Override
    public void onResume()
    {
        super.onResume();

        if (m_manager != null)
        {
            Log.i(Constants.S_TAG, "Resuming location updates");
            m_manager.requestLocationUpdates(m_provider, 20000, 0.0f, this);
        }
    }

    @Override
    public void onMapReady(GoogleMap googleMap)
    {
        m_button = (Button) findViewById(R.id.button);

        m_map = googleMap;
        m_map.setMyLocationEnabled(true);

        m_manager = (LocationManager) getSystemService(LOCATION_SERVICE);
        Criteria criteria = new Criteria();

        m_provider = m_manager.getBestProvider(criteria, true);

        Location location = m_manager.getLastKnownLocation(m_provider);
        onLocationChanged(location);

        m_manager.requestLocationUpdates(m_provider, 20000, 0.0f, this);
    }

    @Override
    public void onLocationChanged(Location location)
    {
        m_lastLocation = null;
        m_lastAddress = null;

        if ((location != null) && (m_map != null))
        {
            Log.i(Constants.S_TAG, "Location changed to: " + location.toString());

            Geocoder coder = new Geocoder(this, Locale.getDefault());
            m_lastLocation = location;
            m_lastAddress = null;

            try
            {
                List<Address> addresses = coder.getFromLocation(
                    m_lastLocation.getLatitude(),
                    m_lastLocation.getLongitude(),
                    1
                );

                if (addresses.size() > 0)
                {
                    Address address = addresses.get(0);

                    String city = address.getLocality();
                    String state = address.getAdminArea();
                    String country = address.getCountryCode();

                    if (city != null)
                    {
                        m_lastAddress = city;
                    }
                    if (state != null)
                    {
                        m_lastAddress = (m_lastAddress == null ? state : m_lastAddress + ", " + state);
                    }
                    if ((country != null) && !country.equals("US"))
                    {
                        m_lastAddress = (m_lastAddress == null ? country : m_lastAddress + ", " + country);
                    }
                }
            }
            catch (IOException e)
            {
                Log.e(Constants.S_TAG, e.getMessage());
            }

            LatLng pos = new LatLng(m_lastLocation.getLatitude(), m_lastLocation.getLongitude());

            m_map.moveCamera(CameraUpdateFactory.newLatLng(pos));
            m_map.animateCamera(CameraUpdateFactory.zoomTo(5.0f));
            m_map.clear();

            m_button.setClickable(true);

            Marker marker = m_map.addMarker(new MarkerOptions().position(pos));
            marker.setTitle(m_lastAddress == null ? "Unknown" : m_lastAddress);
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

    public void onLocation(View v)
    {
        if (m_lastLocation == null)
        {
            Log.w(Constants.S_TAG, "No location available");
        }
        else if (m_lastAddress == null)
        {
            Log.w(Constants.S_TAG, "No address available");
        }
        else
        {
            m_apiManager.locationUpdate(
                m_lastAddress,
                String.valueOf(m_lastLocation.getLatitude()),
                String.valueOf(m_lastLocation.getLongitude())
            );
        }
    }

    public void onDrunk(View v)
    {
        Log.i(Constants.S_TAG, "Drunk status posted");
        m_apiManager.drunkUpdate("1");
    }

    public void onSober(View v)
    {
        Log.i(Constants.S_TAG, "Sober status posted");
        m_apiManager.drunkUpdate("0");
    }
}
