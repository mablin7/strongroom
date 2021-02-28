package com.strongroom;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.Intent;
import android.content.IntentSender;
import android.database.Cursor;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.provider.MediaStore;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.GuardedAsyncTask;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;

import java.lang.ref.WeakReference;
import java.util.Arrays;

public class MediaDeleter extends ReactContextBaseJavaModule implements ActivityEventListener {

    private static final String ERROR_INVALID_ARGS = "E_INVALID_ARGUMENTS";
    private static final String ERROR_UNABLE_TO_DELETE = "E_UNABLE_TO_DELETE";
    private static final String ERROR_USER_CANCELLED_DELETE = "E_USER_CANCELLED_DELETE";
    private static final int REQUEST_CODE_DELETE = 999;

    private Promise mCurrentPromise = null;

    MediaDeleter(ReactApplicationContext context) {
        super(context);
    }

    @Override
    @NonNull
    public String getName() {
        return "MediaDeleter";
    }

    @Override
    public void initialize() {
        super.initialize();
        getReactApplicationContext().addActivityEventListener(this);
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        getReactApplicationContext().removeActivityEventListener(this);
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        if (requestCode == REQUEST_CODE_DELETE && mCurrentPromise != null) {
            if (resultCode == -1) mCurrentPromise.resolve(null);
            else
                mCurrentPromise.reject(ERROR_USER_CANCELLED_DELETE, "The user cancelled the delete");
            mCurrentPromise = null;
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
        /* Do nothing */
    }

    @ReactMethod
    public void deleteMedia(ReadableArray uris, Promise promise) {
        if (mCurrentPromise != null) {
            promise.reject(ERROR_UNABLE_TO_DELETE, "Delete already in progress");
        } else if (uris.size() == 0) {
            promise.reject(ERROR_INVALID_ARGS, "Need at least one URI to delete");
        } else {
            mCurrentPromise = promise;
            new DeletePhotos(new WeakReference<>(getReactApplicationContext()), new WeakReference<>(getCurrentActivity()), uris, promise)
                    .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
        }
    }

    private static class DeletePhotos extends GuardedAsyncTask<Void, Void> {

        private final WeakReference<ReactContext> mContext;
        private final WeakReference<Activity> mActivity;
        private final ReadableArray mUris;
        private final Promise mPromise;

        public DeletePhotos(WeakReference<ReactContext> context, WeakReference<Activity> activity, ReadableArray uris, Promise promise) {
            super(context.get().getExceptionHandler());
            mContext = context;
            mActivity = activity;
            mUris = uris;
            mPromise = promise;
        }

        @Override
        protected void doInBackgroundGuarded(Void... params) {
            ContentResolver resolver = mContext.get().getContentResolver();

            Uri[] uris = new Uri[mUris.size()];
            for (int i = 0; i < mUris.size(); i++) {
                String uriString = mUris.getString(i);
                String[] splits = uriString.split("%3A");
                long num = Long.parseLong(splits[splits.length - 1]);
                uris[i] = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, num);
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                PendingIntent deleteIntent = MediaStore.createDeleteRequest(resolver, Arrays.asList(uris));
                try {
                    mActivity.get().startIntentSenderForResult(deleteIntent.getIntentSender(), REQUEST_CODE_DELETE, null, 0, 0, 0);
                } catch (IntentSender.SendIntentException e) {
                    mPromise.reject(ERROR_UNABLE_TO_DELETE, e.getMessage());
                }
            } else {
                int deletedCount = 0;
                for (Uri deleteUri : uris) {
                    deletedCount += resolver.delete(deleteUri, null, null);
                }

                if (deletedCount == mUris.size()) {
                    mPromise.resolve(true);
                } else {
                    mPromise.reject(ERROR_UNABLE_TO_DELETE, "Could not delete all media, only deleted " + deletedCount + " photos.");
                }
            }
        }

    }
}