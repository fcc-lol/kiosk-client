const API_BASE_URL = process.env.REACT_APP_API_SERVER_URL;

const getApiKeyFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("fccApiKey") || params.get("apiKey");
};

const handleError = async (response) => {
  if (!response.ok) {
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage =
        errorData.error || `HTTP error! status: ${response.status}`;
    } catch (e) {
      errorMessage = `HTTP error! status: ${response.status}`;
    }
    throw new Error(errorMessage);
  }
};

export const fetchAvailableUrls = async () => {
  try {
    const apiKey = getApiKeyFromUrl();
    if (!apiKey) {
      throw new Error("API key is required");
    }
    const response = await fetch(`${API_BASE_URL}/urls?fccApiKey=${apiKey}`);
    await handleError(response);
    return response.json();
  } catch (error) {
    console.error("Error fetching URLs:", error);
    throw error;
  }
};

export const addUrl = async (data) => {
  try {
    const apiKey = getApiKeyFromUrl();
    if (!apiKey) {
      throw new Error("API key is required");
    }
    const response = await fetch(`${API_BASE_URL}/add-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ...data, fccApiKey: apiKey })
    });
    await handleError(response);
    return response.json();
  } catch (error) {
    console.error("Error adding URL:", error);
    throw error;
  }
};

export const removeUrl = async (data) => {
  try {
    const apiKey = getApiKeyFromUrl();
    if (!apiKey) {
      throw new Error("API key is required");
    }
    const response = await fetch(`${API_BASE_URL}/remove-url`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ...data, fccApiKey: apiKey })
    });
    await handleError(response);
    return response.json();
  } catch (error) {
    console.error("Error removing URL:", error);
    throw error;
  }
};

export const editUrl = async (data) => {
  try {
    const apiKey = getApiKeyFromUrl();
    if (!apiKey) {
      throw new Error("API key is required");
    }
    const { oldId, ...updateData } = data;
    const response = await fetch(`${API_BASE_URL}/edit-url`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: oldId,
        newId: updateData.id,
        title: updateData.title,
        url: updateData.url,
        fccApiKey: apiKey
      })
    });
    await handleError(response);
    return response.json();
  } catch (error) {
    console.error("Error editing URL:", error);
    throw error;
  }
};

export const changeUrl = async (id) => {
  try {
    const apiKey = getApiKeyFromUrl();
    if (!apiKey) {
      throw new Error("API key is required");
    }
    const response = await fetch(`${API_BASE_URL}/change-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id, fccApiKey: apiKey })
    });
    await handleError(response);
    return response.json();
  } catch (error) {
    console.error("Error changing URL:", error);
    throw error;
  }
};

export const getCurrentUrl = async () => {
  try {
    const apiKey = getApiKeyFromUrl();
    if (!apiKey) {
      throw new Error("API key is required");
    }
    const response = await fetch(
      `${API_BASE_URL}/current-url?fccApiKey=${apiKey}`
    );
    await handleError(response);
    return response.json();
  } catch (error) {
    console.error("Error fetching current URL:", error);
    throw error;
  }
};
