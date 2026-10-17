package com.aiot.assistivesuite;

import android.Manifest;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.telephony.SmsManager;

import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;

@CapacitorPlugin(
        name = "EmergencyActions",
        permissions = {
                @Permission(
                        alias = "emergency",
                        strings = {
                                Manifest.permission.CALL_PHONE,
                                Manifest.permission.SEND_SMS
                        }
                )
        }
)
public class EmergencyActionsPlugin extends Plugin {

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (hasEmergencyPermission()) {
            call.resolve();
            return;
        }

        requestPermissionForAlias("emergency", call, "emergencyPermissionsCallback");
    }

    @PermissionCallback
    private void emergencyPermissionsCallback(PluginCall call) {
        if (hasEmergencyPermission()) {
            call.resolve();
        } else {
            call.reject("Phone and SMS permissions are required for automatic emergency actions.");
        }
    }

    @PluginMethod
    public void sendEmergencyAlert(PluginCall call) {
        if (!hasEmergencyPermission()) {
            requestPermissionForAlias("emergency", call, "emergencyAlertPermissionsCallback");
            return;
        }

        String phone = call.getString("phone");
        String message = call.getString("message");

        if (phone == null || message == null || phone.trim().isEmpty() || message.trim().isEmpty()) {
            call.reject("A phone number and emergency message are required.");
            return;
        }

        String normalizedPhone = normalizePhone(phone);
        if (normalizedPhone.length() < 8) {
            call.reject("The emergency phone number is not valid.");
            return;
        }

        try {
            sendSms(normalizedPhone, message);
            startPhoneCall(normalizedPhone);
            call.resolve();
        } catch (ActivityNotFoundException exception) {
            call.reject("This Android device cannot place a phone call.", exception);
        } catch (Exception exception) {
            call.reject("Android could not start the emergency SMS and call.", exception);
        }
    }

    @PermissionCallback
    private void emergencyAlertPermissionsCallback(PluginCall call) {
        if (hasEmergencyPermission()) {
            sendEmergencyAlert(call);
        } else {
            call.reject("Phone and SMS permissions are required for automatic emergency actions.");
        }
    }

    private boolean hasEmergencyPermission() {
        return getPermissionState("emergency") == PermissionState.GRANTED;
    }

    private void sendSms(String phone, String message) {
        SmsManager smsManager = SmsManager.getDefault();
        ArrayList<String> messageParts = smsManager.divideMessage(message);
        smsManager.sendMultipartTextMessage(phone, null, messageParts, null, null);
    }

    private void startPhoneCall(String phone) {
        Intent callIntent = new Intent(Intent.ACTION_CALL);
        callIntent.setData(Uri.parse("tel:" + Uri.encode(phone)));
        callIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        if (callIntent.resolveActivity(getActivity().getPackageManager()) == null) {
            throw new ActivityNotFoundException("No phone application is available");
        }

        getActivity().startActivity(callIntent);
    }

    private String normalizePhone(String value) {
        String trimmed = value.trim();
        boolean hasPlus = trimmed.startsWith("+");
        String digits = trimmed.replaceAll("[^0-9]", "");
        return hasPlus ? "+" + digits : digits;
    }
}
