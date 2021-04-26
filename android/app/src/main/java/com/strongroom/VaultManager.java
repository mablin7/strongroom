package com.strongroom;
import android.util.Log;

import com.facebook.common.util.Hex;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.util.Map;
import java.util.HashMap;

import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;

public class VaultManager extends ReactContextBaseJavaModule {

    public static final String KEY_ALGORITHM = "AES";
    public static final String KEYGEN_ALGORITHM = "PBKDF2WithHmacSHA512";
    public static final String CIPHER_ALGORITHM = "AES/CBC/PKCS7Padding";

    private static final String ERROR_PBEKEYGEN = "ERR_PBEKEYGEN";

    VaultManager(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "VaultManager";
    }

    public static SecretKey getKeyFromString(String hexKey) {
        byte[] key = Hex.decodeHex(hexKey);
        SecretKey secretKey = new SecretKeySpec(key, KEY_ALGORITHM);
        return  secretKey;
    }

    @ReactMethod
    public void deriveKey(String password, String salt, Integer cost, Integer length, Promise promise) {
        try {
            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt.getBytes("UTF_8"), cost, length);
            SecretKey key = SecretKeyFactory.getInstance(KEYGEN_ALGORITHM).generateSecret(spec);
            byte[] encodedKey = key.getEncoded();
            promise.resolve(Hex.encodeHex(encodedKey, false));
        } catch (Exception e) {
            promise.reject(ERROR_PBEKEYGEN, e.getMessage());
        }
    }

    @ReactMethod
    public void test() {
        try {
            String t = "test", s = "salt";
            int cost = 1000, len = 256;
            PBEKeySpec spec = new PBEKeySpec(t.toCharArray(), s.getBytes("UTF_8"), cost, len);
            SecretKey key = SecretKeyFactory.getInstance(KEYGEN_ALGORITHM).generateSecret(spec);
            byte[] encodedKey = key.getEncoded();
            String hexKey = Hex.encodeHex(encodedKey, false);

            byte[] keydec = Hex.decodeHex(hexKey);
            SecretKey secretKey = new SecretKeySpec(keydec, KEY_ALGORITHM);

            Log.d("VaultManager", "Key derivation works: " + secretKey.equals(key) + "\n" + secretKey.toString() + " " + key.toString());
        } catch (Exception e) {

        }
    }

//    @ReactMethod
//    public String getManifest(String vaultPath, String key, Promise promise) {
//
//    }
//
//    @ReactMethod
//    public void updateManifest(String vaultPath, String key, String newManifest, Promise promise) {
//
//    }
}