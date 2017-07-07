class CreateServers < ActiveRecord::Migration
  def change
    create_table :servers do |t|
      t.references  :server_type
      t.string      :inventory_num, index: true
      t.string      :serial_num
      t.string      :loc_area,      limit: 20
      t.string      :loc_stand,     limit: 20
      t.string      :loc_place,     limit: 20
      t.text        :comment
      t.timestamps null: false
    end
  end
end
