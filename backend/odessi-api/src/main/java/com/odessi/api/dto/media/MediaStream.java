package com.odessi.api.dto.media;

import java.io.InputStream;
import java.time.Instant;

/**
 * Encapsulates a streaming media asset with its metadata for HTTP delivery.
 */
public record MediaStream(
        InputStream inputStream,
        String contentType,
        long contentLength,
        String eTag,
        Instant lastModified,
        String filename
) implements AutoCloseable {

    @Override
    public void close() throws Exception {
        if (inputStream != null) {
            inputStream.close();
        }
    }
}
