
"use client";

import { useRef, useState } from "react";
import {
  Camera,
  Check,
  ImagePlus,
  Star,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type ReviewFormProps = {
  bookingId: string;
  hotelId: string;
  roomId: string;
  customerId: string;
  onReviewSubmitted?: () => void | Promise<void>;
};

type PreviewImage = {
  file: File;
  preview: string;
};

export default function ReviewForm({
  bookingId,
  hotelId,
  roomId,
  customerId,
  onReviewSubmitted,
}: ReviewFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const MAX_IMAGES = 5;
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const STORAGE_BUCKET = "review-photos";

  const handleImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setError("");

    const selectedFiles = Array.from(
      event.target.files || []
    );

    if (!selectedFiles.length) {
      return;
    }

    const remainingSlots = MAX_IMAGES - images.length;

    if (remainingSlots <= 0) {
      setError("You can upload a maximum of 5 photos.");
      return;
    }

    const filesToAdd = selectedFiles.slice(
      0,
      remainingSlots
    );

    const invalidFile = filesToAdd.find(
      (file) =>
        !file.type.startsWith("image/") ||
        file.size > MAX_FILE_SIZE
    );

    if (invalidFile) {
      setError(
        "Please upload image files smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    const newImages = filesToAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((previous) => [
      ...previous,
      ...newImages,
    ]);

    event.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((previous) => {
      const image = previous[index];

      if (image) {
        URL.revokeObjectURL(image.preview);
      }

      return previous.filter(
        (_, itemIndex) => itemIndex !== index
      );
    });
  };

  const clearImages = () => {
    images.forEach((image) => {
      URL.revokeObjectURL(image.preview);
    });

    setImages([]);
  };

  const uploadReviewPhotos = async (): Promise<string[]> => {
    const uploadedPhotoUrls: string[] = [];

    for (const image of images) {
      const fileExtension =
        image.file.name.split(".").pop()?.toLowerCase() ||
        "jpg";

      const safeFileName = image.file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .slice(0, 80);

      const uniqueFileName = `${safeFileName}-${crypto.randomUUID()}.${fileExtension}`;

      const filePath = `${hotelId}/${bookingId}/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, image.file, {
          cacheControl: "3600",
          upsert: false,
          contentType: image.file.type,
        });

      if (uploadError) {
        console.error(
          "Review photo upload error:",
          uploadError
        );

        throw new Error(
          `Photo upload failed: ${uploadError.message}`
        );
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      if (!publicUrlData.publicUrl) {
        throw new Error(
          "Unable to generate photo URL."
        );
      }

      uploadedPhotoUrls.push(
        publicUrlData.publicUrl
      );
    }

    return uploadedPhotoUrls;
  };

  const handleSubmit = async () => {
    setError("");

    if (!hotelId) {
      setError("Hotel information is missing.");
      return;
    }

    if (!bookingId) {
      setError("Booking information is missing.");
      return;
    }

    if (!roomId) {
      setError("Room information is missing.");
      return;
    }

    if (!customerId) {
      setError("Customer information is missing.");
      return;
    }

    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }

    if (!comment.trim()) {
      setError(
        "Please write a comment about your stay."
      );
      return;
    }

    if (comment.trim().length < 10) {
      setError(
        "Your review should contain at least 10 characters."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const photoUrls = await uploadReviewPhotos();

      const { error: insertError } = await supabase
        .from("reviews")
        .insert({
          booking_id: bookingId,
          hotel_id: hotelId,
          room_id: roomId,
          customer_id: customerId,
          rating,
          comment: comment.trim(),
          photos: photoUrls.length > 0
            ? photoUrls
            : null,
        });

      if (insertError) {
        console.error(
          "Review insert error:",
          insertError
        );

        setError(
          insertError.message ||
            "Unable to submit your review."
        );

        return;
      }

      clearImages();
      setSubmitted(true);

      await onReviewSubmitted?.();
    } catch (submissionError) {
      console.error(
        "Review submission error:",
        submissionError
      );

      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-white">
          <Check size={30} />
        </div>

        <h3 className="mt-5 text-xl font-semibold">
          Thank you for your review!
        </h3>

        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Your experience helps other guests choose
          the right stay.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Guest review
        </p>

        <h3 className="mt-2 text-2xl font-semibold">
          How was your stay?
        </h3>

        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Share your experience with other
          AURASTAYS guests.
        </p>
      </div>

      {/* Rating */}
      <div className="mt-7">
        <p className="text-sm font-medium">
          Your rating
        </p>

        <div className="mt-3 flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => {
            const active =
              star <= (hoverRating || rating);

            return (
              <button
                key={star}
                type="button"
                aria-label={`${star} star rating`}
                onMouseEnter={() =>
                  setHoverRating(star)
                }
                onMouseLeave={() =>
                  setHoverRating(0)
                }
                onClick={() => setRating(star)}
                className="rounded-lg p-1 transition hover:scale-110"
              >
                <Star
                  size={30}
                  fill={
                    active ? "currentColor" : "none"
                  }
                  strokeWidth={1.5}
                  className={
                    active
                      ? "text-neutral-900"
                      : "text-neutral-300"
                  }
                />
              </button>
            );
          })}
        </div>

        {rating > 0 && (
          <p className="mt-2 text-xs text-neutral-500">
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very good"}
            {rating === 5 && "Excellent"}
          </p>
        )}
      </div>

      {/* Comment */}
      <div className="mt-7">
        <div className="flex items-center justify-between">
          <label
            htmlFor="review-comment"
            className="text-sm font-medium"
          >
            Your review
          </label>

          <span className="text-xs text-neutral-400">
            {comment.length}/1000
          </span>
        </div>

        <textarea
          id="review-comment"
          value={comment}
          onChange={(event) =>
            setComment(
              event.target.value.slice(0, 1000)
            )
          }
          placeholder="Tell us what you liked about your stay..."
          rows={5}
          className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white p-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-900"
        />
      </div>

      {/* Photos */}
      <div className="mt-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              Add photos
            </p>

            <p className="mt-1 text-xs text-neutral-400">
              Up to 5 photos · 5 MB each
            </p>
          </div>

          <Camera
            size={20}
            className="text-neutral-400"
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((image, index) => (
            <div
              key={`${image.file.name}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-neutral-200"
            >
              <img
                src={image.preview}
                alt={`Review photo ${index + 1}`}
                className="h-full w-full object-cover"
              />

              <button
                type="button"
                onClick={() => removeImage(index)}
                aria-label="Remove photo"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="flex aspect-square flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 transition hover:border-neutral-900 hover:bg-white hover:text-neutral-900"
            >
              <ImagePlus size={22} />

              <span className="mt-2 text-xs font-medium">
                Add photo
              </span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />

        {images.length > 0 && (
          <p className="mt-2 text-xs text-neutral-400">
            Photos will be uploaded when you submit
            your review.
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Submitting review...
          </>
        ) : (
          <>
            Submit Review
            <Check size={17} />
          </>
        )}
      </button>
    </div>
  );
}