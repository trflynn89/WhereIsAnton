package com.whereisanton.www.whereisanton;

import android.content.Context;
import android.os.AsyncTask;
import android.util.Log;
import android.widget.Toast;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.LinkedHashMap;
import java.util.Map;

public class ApiManager
{
    private Context m_context;
    private boolean m_sending;

    public ApiManager(Context context)
    {
        m_context = context;
        m_sending = false;
    }

    public void checkForUpdate(String currentVersion)
    {
        if (m_sending)
        {
            Toast toast = Toast.makeText(m_context, "Couldn't check for updates, will try later", Toast.LENGTH_SHORT);
            toast.show();
        }
        else
        {
            new UpdateTask().execute(currentVersion);
        }
    }

    public void locationUpdate(String address, String latitude, String longitude)
    {
        if (m_sending)
        {
            Toast toast = Toast.makeText(m_context, "Update in progress, please wait", Toast.LENGTH_SHORT);
            toast.show();
        }
        else
        {
            new LocationTask().execute(address, latitude, longitude);
        }
    }

    public void drunkUpdate(String value)
    {
        if (m_sending)
        {
            Toast toast = Toast.makeText(m_context, "Update in progress, please wait", Toast.LENGTH_SHORT);
            toast.show();
        }
        else
        {
            new DrunkTask().execute(value);
        }
    }

    protected class TaskResult
    {
        int m_responseCode;
        String m_responseText;

        TaskResult(int responseCode, String responseText)
        {
            m_responseCode = responseCode;
            m_responseText = responseText;
        }
    }

    protected class UpdateTask extends AsyncTask<String, String, TaskResult>
    {
        protected TaskResult doInBackground(String ...data)
        {
            Log.i(Constants.S_TAG, "Checking version: '" + data[0] + "'");

            Map<String, String> params = new LinkedHashMap<>();
            params.put("version", data[0]);

            return makeHttpPost(Constants.S_UPDATE_URL, params);
        }

        @Override
        protected void onPostExecute(TaskResult result)
        {
        }
    }

    protected class LocationTask extends AsyncTask<String, String, TaskResult>
    {
        protected TaskResult doInBackground(String... data)
        {
            Log.i(Constants.S_TAG, "Updating location to: '" + data[0] + "'");

            Map<String, String> params = new LinkedHashMap<>();
            params.put("address", data[0]);
            params.put("latitude", data[1]);
            params.put("longitude", data[2]);

            return makeHttpPost(Constants.S_LOCATION_URL, params);
        }

        @Override
        protected void onPostExecute(TaskResult result)
        {
            onResponse(result);
        }
    }

    protected class DrunkTask extends AsyncTask<String, String, TaskResult>
    {
        protected TaskResult doInBackground(String... data)
        {
            Log.i(Constants.S_TAG, "Updating drunk to: '" + data[0] + "'");

            Map<String, String> params = new LinkedHashMap<>();
            params.put("drunk", data[0]);

            return makeHttpPost(Constants.S_DRUNK_URL, params);
        }

        @Override
        protected void onPostExecute(TaskResult result)
        {
            onResponse(result);
        }
    }

    protected TaskResult makeHttpPost(String url, Map<String, String> params)
    {
        final int maxTries = 10;

        for (int i = 0; i < maxTries; ++i)
        {
            try
            {
                return makeHttpPost(new URL(url), params);
            }
            catch (Exception e)
            {
                Log.e(Constants.S_TAG, e.getMessage());
            }
        }

        return new TaskResult(-1, "Timed out sending request");
    }

    protected TaskResult makeHttpPost(URL url, Map<String, String> params) throws Exception
    {
        m_sending = true;

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

        int code = conn.getResponseCode();
        BufferedReader reader;

        if ((code < HttpURLConnection.HTTP_OK) || (code >= HttpURLConnection.HTTP_MULT_CHOICE))
        {
            reader = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
        }
        else
        {
            reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        }

        StringBuilder builder = new StringBuilder();
        String text;

        while ((text = reader.readLine()) != null)
        {
            builder.append(text);
        }
        text = builder.toString();

        Log.i(Constants.S_TAG, "Response code: " + code);
        Log.i(Constants.S_TAG, "Response text: " + text);

        return new TaskResult(code, text);
    }

    protected void onResponse(TaskResult result)
    {
        String message;

        if (result.m_responseCode == HttpURLConnection.HTTP_OK)
        {
            message = "Update sent";
        }
        else if (result.m_responseCode == HttpURLConnection.HTTP_BAD_REQUEST)
        {
            message = "Error with request: " + result.m_responseText;
        }
        else
        {
            message = "Error with server: " + result.m_responseText;
        }

        Toast.makeText(m_context, message, Toast.LENGTH_SHORT).show();
        m_sending = false;
    }
}
