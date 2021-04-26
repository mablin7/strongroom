package com.strongroom;

import android.os.Build;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.stream.Collectors;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.SecretKey;

public class VaultFile {
    String filePath;
    SecretKey key;

    InputStream decryptedStream;

    public VaultFile(String filePath, SecretKey key) {
        this.filePath = filePath;
        this.key = key;
    }

    public InputStream getDecryptedStream()
            throws IOException, NoSuchPaddingException, NoSuchAlgorithmException, InvalidKeyException
    {
        if (decryptedStream == null) {
            try (FileInputStream fis = new FileInputStream(filePath)) {
                Cipher cipher = Cipher.getInstance(VaultManager.CIPHER_ALGORITHM);
                cipher.init(Cipher.DECRYPT_MODE, key);
                decryptedStream = new CipherInputStream(fis, cipher);
            } catch (IOException e) {
                throw e;
            }
        }

        return decryptedStream;
    }

    public String getPlainTextContents()
            throws IOException, NoSuchPaddingException, NoSuchAlgorithmException, InvalidKeyException
    {
        getDecryptedStream();

        ByteArrayOutputStream result = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];
        for (int length; (length = decryptedStream.read(buffer)) != -1; ) {
            result.write(buffer, 0, length);
        }
        return result.toString("UTF-8");
    }

    public void getInputStream() {

    }

    public void writeString(String data) {

    }
}
