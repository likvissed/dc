class CreateStorageSystems < ActiveRecord::Migration
  def change
    create_table :storage_systems do |t|
      t.references  :service
      t.string      :name
      t.timestamps null: false
    end
  end
end
