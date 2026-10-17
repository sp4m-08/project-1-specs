package com.aiot.assistivesuite;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(EmergencyActionsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
