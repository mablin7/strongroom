package com.strongroom;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.Context;
import android.content.Intent;
import android.content.IntentSender;
import android.database.Cursor;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Environment;
import android.provider.DocumentsContract;
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
import java.security.InvalidParameterException;
import java.util.ArrayList;
import java.util.List;

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
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) mCurrentPromise = promise;
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

            List<Uri> uris = new ArrayList<>();
            for (int i = 0; i < mUris.size(); i++) {
                String uriString = mUris.getString(i);
                Uri uri = Uri.parse(uriString);
                Uri extUri = getExtUri(mContext.get(), uri);
                uris.add(extUri);
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                PendingIntent deleteIntent = MediaStore.createDeleteRequest(resolver, uris);
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

    /**
     * Get a file path from a Uri. This will get the the path for Storage Access
     * Framework Documents, as well as the _data field for the MediaStore and
     * other file-based ContentProviders.
     *
     * @param context The context.
     * @param uri The Uri to query.
     * @author paulburke
     */
    public static Uri getExtUri(final Context context, final Uri uri) {
        // DocumentProvider
        String path = "";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && DocumentsContract.isDocumentUri(context, uri)) {
            // ExternalStorageProvider
            if (isExternalStorageDocument(uri)) {
                final String docId = DocumentsContract.getDocumentId(uri);
                final String[] split = docId.split(":");
                final String type = split[0];

                if ("primary".equalsIgnoreCase(type)) {
                    path = Environment.getExternalStorageDirectory() + "/" + split[1];
                }
            }
            // DownloadsProvider
            else if (isDownloadsDocument(uri)) {
                String name = getColumn(context, uri, null, null, "_display_name");
                path = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS).getPath() + "/" + name;

            }
            // MediaProvider
            else if (isMediaDocument(uri)) {
                final String docId = DocumentsContract.getDocumentId(uri);
                final String[] split = docId.split(":");
                final String type = split[0];

                Uri contentUri = null;
                if ("image".equals(type)) {
                    contentUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                } else if ("video".equals(type)) {
                    contentUri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
                } else if ("audio".equals(type)) {
                    contentUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
                }

                final String selection = "_id=?";
                final String[] selectionArgs = new String[] {
                        split[1]
                };

                path = getColumn(context, contentUri, selection, selectionArgs, "_data");
            }
        }
        // MediaStore (and general)
        else if ("content".equalsIgnoreCase(uri.getScheme())) {
            path = getColumn(context, uri, null, null, "_data");
        }
        // File
        else if ("file".equalsIgnoreCase(uri.getScheme())) {
            path = uri.getPath();
        }

        if(!path.isEmpty()) {
            String[] selectionArgs = new String[]{path};
            String id = getColumn(context, MediaStore.Images.Media.EXTERNAL_CONTENT_URI, MediaStore.Images.Media.DATA + " = ?", selectionArgs, MediaStore.Images.Media._ID);
            if (id != null)
                return ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, Long.parseLong(id));

            id = getColumn(context, MediaStore.Video.Media.EXTERNAL_CONTENT_URI, MediaStore.Images.Media.DATA + " = ?", selectionArgs, MediaStore.Images.Media._ID);
            if (id != null)
                return ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, Long.parseLong(id));

            throw new InvalidParameterException(path + " is not a valid image or video file!");
        }

        throw new InvalidParameterException(uri + " is not a valid image or video file!");
    }

    public static String getColumn(Context context, Uri uri, String selection,
                                   String[] selectionArgs, String column) {

        final String[] projection = {
                column
        };
        try (Cursor cursor = context.getContentResolver().query(uri, projection, selection, selectionArgs,
                null)) {
            if (cursor != null && cursor.moveToFirst()) {
                final int column_index = cursor.getColumnIndexOrThrow(column);
                return cursor.getString(column_index);
            }
        }
        return null;
    }


    /**
     * @param uri The Uri to check.
     * @return Whether the Uri authority is ExternalStorageProvider.
     */
    public static boolean isExternalStorageDocument(Uri uri) {
        return "com.android.externalstorage.documents".equals(uri.getAuthority());
    }

    /**
     * @param uri The Uri to check.
     * @return Whether the Uri authority is DownloadsProvider.
     */
    public static boolean isDownloadsDocument(Uri uri) {
        return "com.android.providers.downloads.documents".equals(uri.getAuthority());
    }

    /**
     * @param uri The Uri to check.
     * @return Whether the Uri authority is MediaProvider.
     */
    public static boolean isMediaDocument(Uri uri) {
        return "com.android.providers.media.documents".equals(uri.getAuthority());
    }

}
