"use client";

import { CldImage } from 'next-cloudinary';

export default function CldImageWrapper(props) {
  return <CldImage {...props} />;
}