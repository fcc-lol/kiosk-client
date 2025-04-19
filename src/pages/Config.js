import { useState, useEffect, useCallback, useRef } from "react";
import {
  addUrl,
  removeUrl,
  fetchAvailableUrls,
  editUrl,
  changeUrl,
  getCurrentUrl
} from "../api";
import styled from "styled-components";
import "@fortawesome/fontawesome-free/css/all.css";

const Container = styled.div`
  margin: 0 auto;
  min-height: 100vh;
  color: #ffffff;
  background-color: #2d2d2d;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const Input = styled.input`
  background-color: transparent;
  width: 100%;
  color: #ffffff;
  border: none;
  font-size: 1.125rem;
  line-height: 1.5;
  font-family: inherit;
  padding: 1rem 1.5rem;
  height: 100%;

  &:focus {
    outline: none;
    border-color: #ffffff;
  }
`;

const Button = styled.button`
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.5);
  padding: 0.25rem;
  min-width: 2rem;
  height: 2rem;

  &:hover {
    color: rgba(255, 255, 255, 1);
  }

  &.active {
    color: #4caf50;
  }

  &.check-button {
    margin-left: auto;
    margin-right: 1rem;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  table-layout: fixed;
  min-width: 800px;
`;

const TableHeader = styled.th`
  padding: 1rem 1.5rem;
  text-align: left;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
  text-transform: uppercase;

  &:nth-child(1) {
    width: 10%;
  }
  &:nth-child(2) {
    width: 20%;
  }
  &:nth-child(3) {
    width: 40%;
  }
  &:nth-child(4) {
    width: 100px;
  }
`;

const TableCell = styled.td`
  text-align: left;
  font-size: 1.125rem;
  line-height: 1.5;
  height: 2rem;
  word-break: break-all;
  margin: 0;
  padding: 0;
  max-width: 0;
  overflow: hidden;
  position: relative;

  &:not(:last-child)::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 1rem;
    height: 100%;
    background: linear-gradient(
      to right,
      transparent,
      ${(props) =>
        props.isLastRow
          ? "transparent"
          : props.isOdd
          ? "rgb(54, 54, 54)"
          : "#2d2d2d"}
    );
    pointer-events: none;
  }

  &:last-child {
    text-align: right;
    width: auto;
    white-space: nowrap;
    padding-right: 1rem;
    overflow: visible;
  }
`;

const HiddenButton = styled(Button)`
  visibility: hidden;
`;

const TableRow = styled.tr`
  &:nth-child(odd) {
    background-color: rgb(54, 54, 54);
  }
  &:nth-child(even) {
    background-color: transparent;
  }
`;

const Buttons = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-end;
  width: fit-content;
  margin-left: auto;
  min-width: max-content;
`;

const Config = () => {
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    url: ""
  });
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState({});
  const [debounceTimers, setDebounceTimers] = useState({});
  const [error, setError] = useState(null);
  const [, setActiveInput] = useState(null);
  const [focusedInput, setFocusedInput] = useState(null);
  const [currentUrlId, setCurrentUrlId] = useState(null);
  const inputRefs = useRef({});
  const newIdInputRef = useRef(null);

  useEffect(() => {
    // Set background color when component mounts
    document.documentElement.style.backgroundColor = "#2d2d2d";

    // Cleanup function to reset background color when component unmounts
    return () => {
      document.documentElement.style.backgroundColor = "#000";
    };
  }, []);

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        const [urlsData, currentUrlData] = await Promise.all([
          fetchAvailableUrls(),
          getCurrentUrl()
        ]);
        setUrls(urlsData);
        if (currentUrlData?.id) {
          setCurrentUrlId(currentUrlData.id);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch URLs");
      } finally {
        setLoading(false);
      }
    };
    fetchUrls();
  }, []);

  useEffect(() => {
    if (urls.length > 0) {
      const initialEditData = urls.reduce((acc, url) => {
        acc[url.id] = {
          title: url.title,
          url: url.url
        };
        return acc;
      }, {});
      setEditData(initialEditData);
    }
  }, [urls]);

  const handleAddUrl = async (e) => {
    e.preventDefault();
    if (!hasFormContent) return;
    setError(null);

    try {
      await addUrl(formData);
      setFormData({ id: "", title: "", url: "" });
      // Refresh the URLs list
      const data = await fetchAvailableUrls();
      setUrls(data);
      // Focus the ID input and scroll to form row
      if (newIdInputRef.current) {
        newIdInputRef.current.focus();
      }
      setTimeout(() => {
        const formRow = document.querySelector("tbody tr:last-child");
        if (formRow) {
          formRow.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }, 100);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveUrl = async (id) => {
    setError(null);
    // Get the URL details for the confirmation message
    const urlToDelete = urls.find((u) => u.id === id);
    const confirmMessage = `Are you sure you want to delete "${
      urlToDelete?.title || urlToDelete?.id
    }"?`;

    if (window.confirm(confirmMessage)) {
      try {
        await removeUrl({ id });
        // Refresh the URLs list
        const data = await fetchAvailableUrls();
        setUrls(data);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInputFocus = (id, name) => {
    setFocusedInput({ id, name });
  };

  const handleInputBlur = (e, id, name) => {
    // Only blur if we're not currently focused on this input
    if (focusedInput?.id !== id || focusedInput?.name !== name) {
      return;
    }
    setFocusedInput(null);
  };

  const handleEditInputChange = (e, id) => {
    const { name, value } = e.target;
    setActiveInput({ id, name });

    // Create new edit data with the updated value
    const newEditData = {
      ...editData[id],
      [name]: value
    };

    // Update the editData state
    setEditData((prev) => ({
      ...prev,
      [id]: newEditData
    }));

    // Send the update with the current values
    const updateData = {
      oldId: id,
      ...newEditData
    };

    // Trigger debounced save with current value
    debouncedEditUrl(id, updateData);
  };

  const debouncedEditUrl = useCallback(
    (id, currentValue) => {
      // Clear any existing timer for this id
      if (debounceTimers[id]) {
        clearTimeout(debounceTimers[id]);
      }

      // Set a new timer
      const timer = setTimeout(async () => {
        try {
          setError(null);
          // Ensure we have at least one field to update
          const updateData = {
            oldId: id,
            ...currentValue
          };

          // Only proceed if we have at least one field to update
          if (Object.keys(updateData).length > 1) {
            // > 1 because oldId is always included
            await editUrl(updateData);
            // Refresh the URLs list after successful edit
            const data = await fetchAvailableUrls();
            setUrls(data);
          }
        } catch (err) {
          setError(err.message);
          // Revert the edit if it failed
          const data = await fetchAvailableUrls();
          setUrls(data);
          // Reset the edit data for this ID
          setEditData((prev) => ({
            ...prev,
            [id]: {
              id: data.find((u) => u.id === id)?.id || id,
              title: data.find((u) => u.id === id)?.title || "",
              url: data.find((u) => u.id === id)?.url || ""
            }
          }));
        }
      }, 500);

      // Store the timer ID
      setDebounceTimers((prev) => ({
        ...prev,
        [id]: timer
      }));
    },
    [debounceTimers]
  );

  const hasFormContent = formData.id || formData.title || formData.url;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers).forEach((timer) => clearTimeout(timer));
    };
  }, [debounceTimers]);

  const handleSwitchUrl = async (id) => {
    setError(null);
    try {
      await changeUrl(id);
      setCurrentUrlId(id);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container>
      {error && (
        <Table>
          <thead>
            <tr>
              <TableHeader>{error}</TableHeader>
            </tr>
          </thead>
        </Table>
      )}
      {loading ? (
        <Table>
          <thead>
            <tr>
              <TableHeader>Loading...</TableHeader>
            </tr>
          </thead>
        </Table>
      ) : (
        <>
          {!error && urls.length === 0 ? (
            <Table>
              <thead>
                <tr>
                  <TableHeader>No URLs configured yet</TableHeader>
                </tr>
              </thead>
            </Table>
          ) : (
            !error && (
              <Table>
                <thead>
                  <tr>
                    <TableHeader>ID</TableHeader>
                    <TableHeader>Title</TableHeader>
                    <TableHeader>URL</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {urls.map((url, index) => (
                    <TableRow key={url.id}>
                      <TableCell
                        isOdd={index % 2 === 0}
                        isLastRow={index === urls.length - 1}
                      >
                        <Input
                          ref={(el) => (inputRefs.current[`${url.id}-id`] = el)}
                          type="text"
                          name="id"
                          data-id={url.id}
                          value={editData[url.id]?.id || url.id}
                          onChange={(e) => handleEditInputChange(e, url.id)}
                          onFocus={() => handleInputFocus(url.id, "id")}
                          onBlur={(e) => handleInputBlur(e, url.id, "id")}
                          disabled={false}
                          autocomplete="off"
                          data-1p-ignore
                          data-form-type="other"
                          data-lpignore="true"
                        />
                      </TableCell>
                      <TableCell
                        isOdd={index % 2 === 0}
                        isLastRow={index === urls.length - 1}
                      >
                        <Input
                          ref={(el) =>
                            (inputRefs.current[`${url.id}-title`] = el)
                          }
                          type="text"
                          name="title"
                          data-id={url.id}
                          value={editData[url.id]?.title || url.title}
                          onChange={(e) => handleEditInputChange(e, url.id)}
                          onFocus={() => handleInputFocus(url.id, "title")}
                          onBlur={(e) => handleInputBlur(e, url.id, "title")}
                          autocomplete="off"
                          data-1p-ignore
                          data-form-type="other"
                          data-lpignore="true"
                        />
                      </TableCell>
                      <TableCell
                        isOdd={index % 2 === 0}
                        isLastRow={index === urls.length - 1}
                      >
                        <Input
                          ref={(el) =>
                            (inputRefs.current[`${url.id}-url`] = el)
                          }
                          type="url"
                          name="url"
                          data-id={url.id}
                          value={editData[url.id]?.url || url.url}
                          onChange={(e) => handleEditInputChange(e, url.id)}
                          onFocus={() => handleInputFocus(url.id, "url")}
                          onBlur={(e) => handleInputBlur(e, url.id, "url")}
                          autocomplete="off"
                          data-1p-ignore
                          data-form-type="other"
                          data-lpignore="true"
                        />
                      </TableCell>
                      <TableCell>
                        <Buttons>
                          {currentUrlId !== url.id && (
                            <Button
                              onClick={() => handleSwitchUrl(url.id)}
                              title="Switch to this URL"
                            >
                              <i className="fas fa-play"></i>
                            </Button>
                          )}
                          <Button
                            onClick={() =>
                              window.open(
                                editData[url.id]?.url || url.url,
                                "_blank"
                              )
                            }
                            title="Open in new tab"
                          >
                            <i className="fas fa-external-link-alt"></i>
                          </Button>
                          <Button
                            onClick={() => handleRemoveUrl(url.id)}
                            title="Delete URL"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </Buttons>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell isOdd={urls.length % 2 === 0} isLastRow={true}>
                      <Input
                        ref={newIdInputRef}
                        type="text"
                        name="id"
                        value={formData.id}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && hasFormContent) {
                            e.preventDefault();
                            handleAddUrl(e);
                          }
                        }}
                        placeholder="Identifier"
                        required
                        autocomplete="off"
                        data-1p-ignore
                        data-form-type="other"
                        data-lpignore="true"
                      />
                    </TableCell>
                    <TableCell isOdd={urls.length % 2 === 0} isLastRow={true}>
                      <Input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && hasFormContent) {
                            e.preventDefault();
                            handleAddUrl(e);
                          }
                        }}
                        placeholder="Title"
                        required
                        autocomplete="off"
                        data-1p-ignore
                        data-form-type="other"
                        data-lpignore="true"
                      />
                    </TableCell>
                    <TableCell isOdd={urls.length % 2 === 0} isLastRow={true}>
                      <Input
                        type="url"
                        name="url"
                        value={formData.url}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && hasFormContent) {
                            e.preventDefault();
                            handleAddUrl(e);
                          }
                        }}
                        placeholder="URL"
                        required
                        autocomplete="off"
                        data-1p-ignore
                        data-form-type="other"
                        data-lpignore="true"
                      />
                    </TableCell>
                    <TableCell>
                      {hasFormContent ? (
                        <Button className="check-button" onClick={handleAddUrl}>
                          <i className="fas fa-check"></i>
                        </Button>
                      ) : (
                        <HiddenButton className="check-button">
                          <i className="fas fa-check"></i>
                        </HiddenButton>
                      )}
                    </TableCell>
                  </TableRow>
                </tbody>
              </Table>
            )
          )}
        </>
      )}
    </Container>
  );
};

export default Config;
