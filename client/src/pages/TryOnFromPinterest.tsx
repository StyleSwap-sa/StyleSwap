import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Pin,
  RefreshCw,
  Sparkles,
  Unplug,
} from "lucide-react";
import { toast } from "sonner";
import {VirtualTryOnUpload} from "@/components/VirtualTryOnUpload";

interface PinterestPin {
  id: string;
  title?: string | null;
  description?: string | null;
  link?: string | null;
  media?: {
    images?: {
      "150x150"?: {
        url?: string;
        width?: number;
        height?: number;
      };
      "400x300"?: {
        url?: string;
        width?: number;
        height?: number;
      };
      "600x"?: {
        url?: string;
        width?: number;
        height?: number;
      };
      "1200x"?: {
        url?: string;
        width?: number;
        height?: number;
      };
    };
  };
}

export default function TryOnFromPinterest() {
  const [, setLocation] = useLocation();

  const [selectedPin, setSelectedPin] = useState<PinterestPin | null>(null);
  const [showTryOn, setShowTryOn] = useState(false);

  const connectionQuery = trpc.pinterest.getConnection.useQuery();

  const pinsQuery = trpc.pinterest.getPins.useQuery(undefined, {
    enabled: !!connectionQuery.data?.connected,
  });

  const getPinImageUrl = (pin: PinterestPin) =>
  pin.media?.images?.["1200x"]?.url ??
  pin.media?.images?.["600x"]?.url ??
  pin.media?.images?.["400x300"]?.url ??
  pin.media?.images?.["150x150"]?.url ??
  null;

  const disconnectMutation = trpc.pinterest.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Pinterest disconnected");
      setSelectedPin(null);
      setShowTryOn(false);
      connectionQuery.refetch();
      pinsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to disconnect Pinterest");
    },
  });

  const authUrlQuery = trpc.pinterest.getAuthUrl.useQuery(undefined, {
    enabled: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("connected") === "1") {
      toast.success("Pinterest connected successfully");

      window.history.replaceState(
        {},
        "",
        window.location.pathname
      );

      connectionQuery.refetch();
    }

    const error = params.get("error");

    if (error) {
      toast.error(
        error === "pinterest_connection_failed"
          ? "Pinterest connection failed"
          : `Pinterest connection error: ${error}`
      );

      window.history.replaceState(
        {},
        "",
        window.location.pathname
      );
    }
  }, []);

  const handleConnect = async () => {
    try {
      const result = await authUrlQuery.refetch();

      if (!result.data?.url) {
        throw new Error("Pinterest authorization URL was not returned");
      }

      window.location.href = result.data.url;
    } catch (error) {
      console.error("[Pinterest] Connect error:", error);

      toast.error( 
        error instanceof Error
          ? error.message
          : "Unable to connect Pinterest"
      );
    }
  };

  const handleSelectPin = (pin: PinterestPin) => {
    const imageUrl = getPinImageUrl(pin);

    if (!imageUrl) {
      toast.error("This Pinterest Pin does not contain a usable image.");
      return;
    }

    setSelectedPin(pin);
    setShowTryOn(false);
  };

  const selectedImageUrl = selectedPin
  ? getPinImageUrl(selectedPin)
  : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => setLocation("/dashboard")}
              className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10">
                <Pin className="h-6 w-6 text-red-500" />
              </div>

              <div>
                <h1 className="text-3xl font-bold">
                  Try On From Pinterest
                </h1>

                <p className="text-muted-foreground">
                  Pick a fashion image from Pinterest and see how it looks on
                  you.
                </p>
              </div>
            </div>
          </div>

          {connectionQuery.data?.connected && (
            <Button
              variant="outline"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Unplug className="mr-2 h-4 w-4" />
              )}

              Disconnect Pinterest
            </Button>
          )}
        </div>

        {/* Not connected */}
        {!connectionQuery.isLoading &&
          !connectionQuery.data?.connected && (
            <Card className="mx-auto max-w-2xl">
              <CardContent className="flex flex-col items-center px-6 py-12 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
                  <Pin className="h-8 w-8 text-red-500" />
                </div>

                <h2 className="mb-2 text-2xl font-semibold">
                  Connect Pinterest
                </h2>

                <p className="mb-6 max-w-md text-muted-foreground">
                  Connect your Pinterest account to browse your saved fashion
                  Pins and use them as inspiration for your virtual try-on.
                </p>

                <Button
                  onClick={handleConnect}
                  disabled={authUrlQuery.isFetching}
                  size="lg"
                >
                  {authUrlQuery.isFetching ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Pin className="mr-2 h-5 w-5" />
                  )}

                  Connect Pinterest
                </Button>
              </CardContent>
            </Card>
          )}

        {/* Loading connection */}
        {connectionQuery.isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Connected */}
        {connectionQuery.data?.connected && (
          <>
            {/* Selected image */}
            {selectedPin && selectedImageUrl && (
              <Card className="mb-8 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-6 lg:flex-row">
                    <div className="w-full lg:w-72">
                      <div className="overflow-hidden rounded-xl bg-muted">
                        <img
                          src={selectedImageUrl}
                          alt={
                            selectedPin.title ||
                            selectedPin.description ||
                            "Selected Pinterest Pin"
                          }
                          className="aspect-square w-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-center">
                      <div className="mb-2 flex items-center gap-2 text-sm text-red-500">
                        <Pin className="h-4 w-4" />
                        Selected Pinterest Pin
                      </div>

                      <h2 className="mb-2 text-2xl font-semibold">
                        {selectedPin.title || "Pinterest inspiration"}
                      </h2>

                      {selectedPin.description && (
                        <p className="mb-5 line-clamp-3 text-muted-foreground">
                          {selectedPin.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <Button
                          onClick={() => setShowTryOn(true)}
                          size="lg"
                        >
                          <Sparkles className="mr-2 h-5 w-5" />
                          Try This On
                        </Button>

                        {selectedPin.link && (
                          <Button
                            variant="outline"
                            asChild
                          >
                            <a
                              href={selectedPin.link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View on Pinterest
                            </a>
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSelectedPin(null);
                            setShowTryOn(false);
                          }}
                        >
                          Clear Selection
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Try-on */}
            {showTryOn && selectedImageUrl && (
              <Card className="mb-10">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold">
                      Virtual Try-On
                    </h2>

                    <p className="text-muted-foreground">
                      Upload your photo and we'll use the Pinterest image as
                      the clothing reference.
                    </p>
                  </div>

                  <VirtualTryOnUpload
                    prefillClothImageUrl={selectedImageUrl}
                  />
                </CardContent>
              </Card>
            )}

            {/* Pinterest pins */}
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">
                    Your Pinterest Pins
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Select an image to use for your virtual try-on.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pinsQuery.refetch()}
                  disabled={pinsQuery.isFetching}
                >
                  {pinsQuery.isFetching ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}

                  Refresh
                </Button>
              </div>

              {pinsQuery.isLoading && (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {pinsQuery.isError && (
                <Card>
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <ImageIcon className="mb-4 h-10 w-10 text-muted-foreground" />

                    <h3 className="mb-2 text-lg font-semibold">
                      Couldn't load your Pins
                    </h3>

                    <p className="mb-5 text-sm text-muted-foreground">
                      Pinterest may have expired your connection or the API
                      request failed.
                    </p>

                    <Button
                      variant="outline"
                      onClick={() => pinsQuery.refetch()}
                    >
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              )}

              {!pinsQuery.isLoading &&
                !pinsQuery.isError &&
                pinsQuery.data?.items?.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center py-16 text-center">
                      <Pin className="mb-4 h-10 w-10 text-muted-foreground" />

                      <h3 className="mb-2 text-lg font-semibold">
                        No Pins found
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        Save some fashion inspiration to Pinterest and refresh
                        this page.
                      </p>
                    </CardContent>
                  </Card>
                )}

              {pinsQuery.data?.items &&
                pinsQuery.data.items.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {pinsQuery.data.items.map((pin: PinterestPin) => {
                      const imageUrl = getPinImageUrl(pin);


                      if (!imageUrl) {
                        return null;
                      }

                      const isSelected =
                        selectedPin?.id === pin.id;

                      return (
                        <button
                          key={pin.id}
                          type="button"
                          onClick={() => handleSelectPin(pin)}
                          className={`group overflow-hidden rounded-xl border bg-card text-left transition-all hover:-translate-y-1 hover:shadow-lg ${
                            isSelected
                              ? "ring-2 ring-primary"
                              : ""
                          }`}
                        >
                          <div className="aspect-[3/4] overflow-hidden bg-muted">
                            <img
                              src={imageUrl}
                              alt={
                                pin.title ||
                                pin.description ||
                                "Pinterest Pin"
                              }
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>

                          {pin.title && (
                            <div className="p-3">
                              <p className="line-clamp-2 text-sm font-medium">
                                {pin.title}
                              </p>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}