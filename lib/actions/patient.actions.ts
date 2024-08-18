"use server"

import { ID, Query } from "node-appwrite";
import { BUCKET_ID, DATABASE_ID, databases, ENDPOINT, PATIENT_COLLECTION_ID, PROJECT_ID, storage, users } from "../appwrite.config";
import { parseStringify } from "../utils";

import {InputFile} from "node-appwrite/file"

export const createUser = async (user: CreateUserParams) => {
  try {
    console.log("Creating user with data:", user);
    
    // Logging the endpoint to ensure it's correctly set
    console.log("Appwrite Endpoint:", process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
    
    const newUser = await users.create(
      ID.unique(),
      user.email,
      user.phone,
      undefined,
      user.name
    );
    console.log("New user created:", newUser);

    return parseStringify(newUser);
  } catch (error: any) {
    console.error("Error creating user:", error);

    if (error && error.code === 409) {
      try {
        const documents = await users.list([
          Query.equal("email", [user.email]),
        ]);
        console.log("Existing user found:", documents.users[0]);

        return documents.users[0];
      } catch (listError: any) {
        console.error("Error listing users:", listError);
        throw listError;
      }
    }

    throw error;
  }
};

export const getUser = async (userId: string) => {
  try {
    const user = await users.get(userId)
    console.log("Fetched user:", user); // Debugging log
    return parseStringify(user);
  } catch (error: any) {
    console.log(error)
  }
}

export const registerPatient = async({identificationDocument,userId, ...patient}: RegisterUserParams) => {
  try {
    let file;
    console.log("Fetched user:", userId); // Debugging log

    if(identificationDocument){
      const inputFile = InputFile.fromBuffer(
        identificationDocument?.get('blobFile') as Blob,
        identificationDocument?.get('fileName') as string,
      )

      file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile)
    }

    const newPatient = await databases.createDocument(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      ID.unique(),
      {
        identificationDocumentId: file?.$id ? file.$id : null,
        identificationDocumentUrl: file?.$id
          ? `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view??project=${PROJECT_ID}`
          : null,
          userId,
        ...patient,
      }
    );

     return parseStringify(newPatient);

  } catch (error) {
    console.log(error);
  }
}