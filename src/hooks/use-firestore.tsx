"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  DocumentData,
  QuerySnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { showError, showSuccess } from "@/utils/toast";

interface FirestoreHook<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  fetchData: (conditions?: { field: string; operator: "==" | "<" | ">" | "<=" | ">="; value: any }[]) => Promise<void>;
  addDocument: (document: Omit<T, "id">) => Promise<string | null>;
  updateDocument: (id: string, document: Partial<T>) => Promise<boolean>;
  deleteDocument: (id: string) => Promise<boolean>;
}

export function useFirestore<T extends { id?: string }>(collectionName: string): FirestoreHook<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (conditions?: { field: string; operator: "==" | "<" | ">" | "<=" | ">="; value: any }[]) => {
    setLoading(true);
    setError(null);
    try {
      const colRef = collection(db, collectionName);
      let q = query(colRef);

      if (conditions && conditions.length > 0) {
        conditions.forEach(condition => {
          q = query(q, where(condition.field, condition.operator, condition.value));
        });
      }

      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
      const fetchedData: T[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
      setData(fetchedData);
    } catch (err: any) {
      console.error(`Error fetching data from ${collectionName}:`, err);
      setError(`Failed to fetch data: ${err.message}`);
      showError(`Failed to fetch ${collectionName} data.`);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  const addDocument = useCallback(async (document: Omit<T, "id">): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const colRef = collection(db, collectionName);
      const docRef = await addDoc(colRef, { ...document, createdAt: serverTimestamp() });
      showSuccess(`${collectionName.slice(0, -1)} added successfully!`);
      fetchData(); // Refresh data after adding
      return docRef.id;
    } catch (err: any) {
      console.error(`Error adding document to ${collectionName}:`, err);
      setError(`Failed to add document: ${err.message}`);
      showError(`Failed to add ${collectionName.slice(0, -1)}.`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [collectionName, fetchData]);

  const updateDocument = useCallback(async (id: string, document: Partial<T>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, { ...document, updatedAt: serverTimestamp() });
      showSuccess(`${collectionName.slice(0, -1)} updated successfully!`);
      fetchData(); // Refresh data after updating
      return true;
    } catch (err: any) {
      console.error(`Error updating document in ${collectionName}:`, err);
      setError(`Failed to update document: ${err.message}`);
      showError(`Failed to update ${collectionName.slice(0, -1)}.`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [collectionName, fetchData]);

  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      showSuccess(`${collectionName.slice(0, -1)} deleted successfully!`);
      fetchData(); // Refresh data after deleting
      return true;
    } catch (err: any) {
      console.error(`Error deleting document from ${collectionName}:`, err);
      setError(`Failed to delete document: ${err.message}`);
      showError(`Failed to delete ${collectionName.slice(0, -1)}.`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [collectionName, fetchData]);

  useEffect(() => {
    fetchData(); // Initial fetch when component mounts
  }, [fetchData]);

  return { data, loading, error, fetchData, addDocument, updateDocument, deleteDocument };
}