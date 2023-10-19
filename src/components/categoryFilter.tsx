/*
  This example requires some changes to your config:
  
  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
    ],
  }
  ```
*/
import { Fragment, useState, useEffect } from "react";
import {
  Dialog,
  Disclosure,
  Menu,
  Popover,
  Transition,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

const filters = [
  {
    id: "status",
    name: "status",
    options: [
      { value: "finished", label: "finished" },
      { value: "on_hiatus", label: "on_hiatus" },
      { value: "currently_publishing", label: "currently_publishing" },
    ],
  },
  {
    id: "genres",
    name: "genres",
    options: [],
  },
];

type onApplyFilters = (filters: filter) => void;
type filter = { genres: string[]; status: string[]; [key: string]: string[] };
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export const CategoryFilter = ({
  onApplyFilters,
  allGenres,
  currentFilters,
}: {
  onApplyFilters: onApplyFilters;
  allGenres: string[];
  currentFilters: filter;
}) => {
  const [open, setOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<filter>({
    genres: currentFilters.genres,
    status: currentFilters.status,
  });

  useEffect(() => {
    const genresFilter = filters.find((f) => f.id === "genres");
    if (genresFilter) {
      const sortedGenres = [...allGenres].sort();
      const options = sortedGenres.map((genre) => ({
        value: genre,
        label: genre,
      }));
      genresFilter.options = options;
    }
  }, [allGenres]);

  const onFilterChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const updatedFilters: filter = { genres: [], status: [] };
    filters.forEach((section) => {
      section.options.forEach((option, optionIdx) => {
        const inputElement = e.currentTarget.querySelector(
          `#filter-${section.id}-${optionIdx}`
        );
        const isChecked =
          inputElement instanceof HTMLInputElement && inputElement.checked;
        if (isChecked) {
          if (section.id === "genres") {
            updatedFilters[section.id].push(option.value);
          } else if (section.id === "status") {
            updatedFilters[section.id].push(option.value);
          }
        }
      });
    });
    setSelectedFilters(updatedFilters);
    onApplyFilters(selectedFilters);
  };
  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    sectionId: string,
    optionValue: string
  ) => {
    const isChecked = e.target.checked;

    const updatedFilters = { ...selectedFilters };
    if (isChecked) {
      updatedFilters[sectionId]?.push(optionValue);
    } else {
      if (updatedFilters[sectionId] as string[]) {
        updatedFilters[sectionId] = (
          updatedFilters[sectionId] as string[]
        ).filter((value) => value !== optionValue);
      }
    }
    setSelectedFilters(updatedFilters);
  };

  const handleClear = (sectionId: string) => {
    const updatedFilters = { ...selectedFilters };
    updatedFilters[sectionId] = []; // Reset the array for the respective section
    setSelectedFilters(updatedFilters);
    onApplyFilters(updatedFilters); // If you want to apply changes immediately
  };

  return (
    <div className="bg-gray-900">
      {/* Mobile filter dialog */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-40 sm:hidden" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white py-4 pb-6 shadow-xl">
                <div className="flex items-center justify-between px-4">
                  <h2 className="text-lg font-medium text-slate-100">
                    Filters
                  </h2>
                  <button
                    type="button"
                    className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md bg-white p-2 text-gray-100 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close menu</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Filters */}
                <form className="mt-4">
                  {filters.map((section) => (
                    <Disclosure
                      as="div"
                      key={section.name}
                      className="border-t border-gray-200 px-4 py-6"
                    >
                      {({ open }) => (
                        <>
                          <h3 className="-mx-2 -my-3 flow-root">
                            <Disclosure.Button className="flex w-full items-center justify-between bg-white px-2 py-3 text-sm text-gray-400">
                              <span className="font-medium text-gray-900">
                                {section.name}
                              </span>
                              <span className="ml-6 flex items-center">
                                <ChevronDownIcon
                                  className={classNames(
                                    open ? "-rotate-180" : "rotate-0",
                                    "h-5 w-5 transform"
                                  )}
                                  aria-hidden="true"
                                />
                              </span>
                            </Disclosure.Button>
                          </h3>
                          <Disclosure.Panel className="pt-6">
                            <div className="space-y-6">
                              {section.options.map((option, optionIdx) => (
                                <div
                                  key={option.value}
                                  className="flex items-center"
                                >
                                  <input
                                    id={`filter-mobile-${section.id}-${optionIdx}`}
                                    name={`${section.id}[]`}
                                    type="checkbox"
                                    checked={
                                      selectedFilters[section.id]?.includes(
                                        option.value
                                      ) || false
                                    }
                                    onChange={(e) =>
                                      handleCheckboxChange(
                                        e,
                                        section.id,
                                        option.value
                                      )
                                    }
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <label
                                    htmlFor={`filter-mobile-${section.id}-${optionIdx}`}
                                    className="ml-3 text-sm text-gray-500"
                                  >
                                    {option.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  ))}
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
      <section aria-labelledby="filter-heading" className=" py-6">
        <h2 id="filter-heading" className="sr-only">
          Manga Filters
        </h2>

        <div className="flex items-center justify-between">
          <Menu as="div" className="relative inline-block text-left">
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            ></Transition>
          </Menu>

          <button
            type="button"
            className="inline-block text-sm font-medium text-slate-100 hover:text-slate-200 sm:hidden"
            onClick={() => setOpen(true)}
          >
            Filters
          </button>

          <Popover.Group className="hidden sm:flex sm:items-baseline sm:space-x-8">
            {filters.map((section, sectionIdx) => (
              <Popover
                as="div"
                key={section.name}
                id={`desktop-menu-${sectionIdx}`}
                className="relative inline-block text-left"
              >
                <div>
                  <Popover.Button className="group inline-flex items-center justify-center text-sm font-medium text-slate-100 hover:text-slate-200">
                    <span>{section.name}</span>

                    <ChevronDownIcon
                      className="-mr-1 ml-1 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                      aria-hidden="true"
                    />
                  </Popover.Button>
                </div>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Popover.Panel className="absolute right-0 z-20 mt-2 origin-top-right rounded-md bg-white p-4 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <form
                      className="grid h-full w-full grid-rows-[auto,1fr] gap-5"
                      onSubmit={onFilterChange}
                    >
                      <div className="min-w-[min-content]">
                        <div className="mb-4 flex gap-2">
                          <button
                            type="submit"
                            className="mt-1  rounded bg-indigo-600 px-5 py-1 text-sm font-medium text-white hover:bg-indigo-500"
                          >
                            Apply
                          </button>
                          <button
                            type="button"
                            className="mt-1  rounded bg-red-600 px-5 py-1 text-sm font-medium text-white hover:bg-red-500"
                            onClick={() => handleClear(section.id)}
                          >
                            Clear
                          </button>
                        </div>
                        <div className="max-h-40 w-full min-w-full overflow-y-auto">
                          {section.options.map((option, optionIdx) => (
                            <div
                              key={option.value}
                              className="flex items-center"
                            >
                              <input
                                id={`filter-${section.id}-${optionIdx}`}
                                name={`${section.id}[]`}
                                type="checkbox"
                                checked={
                                  selectedFilters[section.id]?.includes(
                                    option.value
                                  ) || false
                                }
                                onChange={(e) =>
                                  handleCheckboxChange(
                                    e,
                                    section.id,
                                    option.value
                                  )
                                }
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <label
                                htmlFor={`filter-${section.id}-${optionIdx}`}
                                className="ml-3 whitespace-nowrap pr-6 text-sm font-medium text-gray-900"
                              >
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </form>
                  </Popover.Panel>
                </Transition>
              </Popover>
            ))}
          </Popover.Group>
        </div>
      </section>
    </div>
  );
};
